/**
 * Property notification system for alerting users about new matches
 */

import { createClient } from '@/lib/supabase/client';
import { NormalizedProperty, UserPreferences } from '@/lib/scraping/types';
import { getPropertyManager } from '@/lib/database/property-manager';

export interface NotificationPreferences {
  emailEnabled: boolean;
  emailFrequency: 'instant' | 'daily' | 'weekly';
  minMatchScore: number;
  maxNotificationsPerDay: number;
}

export interface PropertyNotification {
  id: string;
  userId: string;
  propertyId: string;
  type: 'new_match' | 'price_drop' | 'status_change' | 'back_on_market';
  property: NormalizedProperty;
  matchScore: number;
  reason: string;
  createdAt: Date;
  sentAt?: Date;
  viewed?: boolean;
}

export class PropertyNotifier {
  private supabase: ReturnType<typeof createClient>;
  private propertyManager: ReturnType<typeof getPropertyManager>;

  constructor() {
    this.supabase = createClient();
    this.propertyManager = getPropertyManager();
  }

  /**
   * Check for new property matches for a user
   */
  async checkNewMatches(userId: string): Promise<PropertyNotification[]> {
    try {
      // Get user preferences
      const { data: preferences } = await this.supabase
        .from('buyer_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!preferences) {
        return [];
      }

      // Get user's notification preferences
      const notificationPrefs = await this.getUserNotificationPreferences(userId);

      // Get properties matching preferences
      const matchingProperties = await this.propertyManager.getMatchingProperties(
        this.convertToUserPreferences(preferences),
        50 // Check up to 50 properties
      );

      // Filter out properties user has already seen
      const { data: seenProperties } = await this.supabase
        .from('user_properties')
        .select('property_id')
        .eq('user_id', userId);

      const seenPropertyIds = new Set(seenProperties?.map(p => p.property_id) || []);
      
      // Find new matches
      const newMatches = matchingProperties.filter(p => 
        p.id && !seenPropertyIds.has(p.id)
      );

      const notifications: PropertyNotification[] = [];

      for (const property of newMatches) {
        // Calculate match score
        const matchScore = await this.calculateMatchScore(property, preferences);

        // Only notify if score meets minimum threshold
        if (matchScore >= notificationPrefs.minMatchScore) {
          const notification: PropertyNotification = {
            id: `notif-${userId}-${property.id}-${Date.now()}`,
            userId,
            propertyId: property.id!,
            type: 'new_match',
            property,
            matchScore,
            reason: this.generateMatchReason(property, preferences, matchScore),
            createdAt: new Date(),
            viewed: false
          };

          notifications.push(notification);

          // Store notification in database
          await this.storeNotification(notification);

          // Link property to user
          if (property.id) {
            // Check if link already exists
            const { data: existing } = await this.supabase
              .from('user_properties')
              .select('id')
              .eq('user_id', userId)
              .eq('property_id', property.id)
              .single();

            if (!existing) {
              await this.supabase
                .from('user_properties')
                .insert({
                  user_id: userId,
                  property_id: property.id,
                  source: property.dataSources[0] || 'notification',
                  is_favorite: false
                });
            }
          }
        }
      }

      return notifications;

    } catch (error) {
      console.error('Error checking new matches:', error);
      return [];
    }
  }

  /**
   * Check for price drops on user's watched properties
   */
  async checkPriceDrops(userId: string): Promise<PropertyNotification[]> {
    try {
      const notifications: PropertyNotification[] = [];

      // Get user's watched properties
      const { data: userProperties } = await this.supabase
        .from('user_properties')
        .select(`
          property_id,
          property:properties(*)
        `)
        .eq('user_id', userId)
        .eq('is_favorite', true);

      if (!userProperties) return [];

      for (const item of userProperties) {
        const property: any = item.property;
        
        if (!property) continue;
        
        // Check price history in raw_data
        const priceHistory = property.raw_data?.priceHistory || [];
        
        if (priceHistory.length >= 2) {
          const currentPrice = property.list_price;
          const previousPrice = priceHistory[priceHistory.length - 2]?.price;
          
          if (previousPrice && currentPrice < previousPrice) {
            const priceDrop = previousPrice - currentPrice;
            const percentDrop = (priceDrop / previousPrice) * 100;
            
            // Notify if price dropped by more than 2%
            if (percentDrop > 2) {
              const notification: PropertyNotification = {
                id: `price-drop-${userId}-${property.id}-${Date.now()}`,
                userId,
                propertyId: property.id,
                type: 'price_drop',
                property: this.dbToNormalized(property),
                matchScore: 100, // High priority for price drops
                reason: `Price dropped by $${priceDrop.toLocaleString()} (${percentDrop.toFixed(1)}%)`,
                createdAt: new Date(),
                viewed: false
              };

              notifications.push(notification);
              await this.storeNotification(notification);
            }
          }
        }
      }

      return notifications;

    } catch (error) {
      console.error('Error checking price drops:', error);
      return [];
    }
  }

  /**
   * Send notifications to users
   */
  async sendNotifications(notifications: PropertyNotification[]): Promise<void> {
    if (notifications.length === 0) return;

    // Group by user
    const byUser = new Map<string, PropertyNotification[]>();
    
    for (const notification of notifications) {
      if (!byUser.has(notification.userId)) {
        byUser.set(notification.userId, []);
      }
      byUser.get(notification.userId)!.push(notification);
    }

    // Send to each user
    for (const [userId, userNotifications] of Array.from(byUser.entries())) {
      const prefs = await this.getUserNotificationPreferences(userId);
      
      if (prefs.emailEnabled) {
        // Check daily limit
        const todayCount = await this.getTodayNotificationCount(userId);
        
        if (todayCount < prefs.maxNotificationsPerDay) {
          const toSend = userNotifications.slice(
            0, 
            prefs.maxNotificationsPerDay - todayCount
          );
          
          if (prefs.emailFrequency === 'instant') {
            await this.sendInstantEmail(userId, toSend);
          } else {
            // Queue for digest
            await this.queueForDigest(userId, toSend);
          }
          
          // Mark as sent
          for (const notification of toSend) {
            await this.markAsSent(notification.id);
          }
        }
      }
    }
  }

  /**
   * Calculate match score for a property
   */
  private async calculateMatchScore(
    property: NormalizedProperty,
    preferences: any
  ): Promise<number> {
    let score = 0;
    let maxScore = 0;

    // Price match (30 points)
    maxScore += 30;
    if (property.listPrice >= preferences.price_range_min &&
        property.listPrice <= preferences.price_range_max) {
      score += 30;
    } else if (property.listPrice < preferences.price_range_min) {
      // Under budget is better than over
      score += 20;
    }

    // Location match (25 points)
    maxScore += 25;
    if (preferences.city_preferences?.includes(property.city) ||
        preferences.preferred_zip_codes?.includes(property.zipCode)) {
      score += 25;
    }

    // Size match (20 points)
    maxScore += 20;
    if (property.bedrooms >= preferences.bedrooms_needed &&
        property.bathrooms >= preferences.bathrooms_needed) {
      score += 10;
    }
    if (property.squareFeet && preferences.min_square_footage && 
        property.squareFeet >= preferences.min_square_footage) {
      score += 10;
    }

    // Features match (15 points)
    maxScore += 15;
    
    // Pool preference
    if (preferences.pool_preference === 'yes' && property.hasPool) {
      score += 5;
    } else if (preferences.pool_preference === 'no' && !property.hasPool) {
      score += 5;
    } else if (preferences.pool_preference === 'neutral') {
      score += 3;
    }

    // HOA preference
    if (preferences.hoa_preference === 'dont_want' && !property.hasHOA) {
      score += 5;
    } else if (preferences.hoa_preference === 'need' && property.hasHOA) {
      score += 5;
    } else if (preferences.hoa_preference === 'neutral') {
      score += 3;
    }

    // Garage spaces
    if (property.garageSpaces >= preferences.min_garage_spaces) {
      score += 5;
    }

    // Lot size (10 points)
    maxScore += 10;
    if (property.lotSize && property.lotSize >= preferences.min_lot_square_footage) {
      score += 10;
    }

    // Calculate percentage score
    return Math.round((score / maxScore) * 100);
  }

  /**
   * Generate match reason text
   */
  private generateMatchReason(
    property: NormalizedProperty,
    preferences: any,
    matchScore: number
  ): string {
    const reasons: string[] = [];

    // Location
    if (preferences.city_preferences?.includes(property.city)) {
      reasons.push(`Located in preferred city: ${property.city}`);
    }

    // Price
    if (property.listPrice <= preferences.price_range_max * 0.9) {
      reasons.push('Priced below your budget');
    }

    // Size
    if (property.squareFeet && preferences.min_square_footage &&
        property.squareFeet >= preferences.min_square_footage * 1.2) {
      reasons.push('Spacious home with extra square footage');
    }

    // Features
    if (preferences.pool_preference === 'yes' && property.hasPool) {
      reasons.push('Has a pool as requested');
    }

    if (matchScore >= 90) {
      reasons.unshift('Excellent match for your preferences!');
    } else if (matchScore >= 80) {
      reasons.unshift('Great match for your criteria');
    } else if (matchScore >= 70) {
      reasons.unshift('Good match worth considering');
    }

    return reasons.slice(0, 3).join('. ');
  }

  /**
   * Get user notification preferences
   */
  private async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    // In production, this would come from a user settings table
    // For now, return defaults
    return {
      emailEnabled: true,
      emailFrequency: 'instant',
      minMatchScore: 70,
      maxNotificationsPerDay: 5
    };
  }

  /**
   * Store notification in database
   */
  private async storeNotification(notification: PropertyNotification): Promise<void> {
    try {
      await this.supabase
        .from('property_notifications')
        .insert({
          id: notification.id,
          user_id: notification.userId,
          property_id: notification.propertyId,
          type: notification.type,
          match_score: notification.matchScore,
          reason: notification.reason,
          created_at: notification.createdAt.toISOString(),
          viewed: false
        });
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  /**
   * Send instant email notification
   */
  private async sendInstantEmail(
    userId: string,
    notifications: PropertyNotification[]
  ): Promise<void> {
    // Get user email
    const { data: user } = await this.supabase
      .from('user_profiles')
      .select('email, first_name, last_name')
      .eq('id', userId)
      .single();

    if (!user?.email) return;

    // In production, use a service like SendGrid, Postmark, or Resend
    // For now, we'll just log it
    console.log(`Sending property notification email (${notifications.length} matches)`);

    // TODO: Implement actual email sending
  }

  /**
   * Queue notifications for digest
   */
  private async queueForDigest(
    userId: string,
    notifications: PropertyNotification[]
  ): Promise<void> {
    for (const notification of notifications) {
      await this.supabase
        .from('notification_queue')
        .insert({
          user_id: userId,
          notification_id: notification.id,
          scheduled_for: this.getNextDigestTime(notification.userId)
        });
    }
  }

  /**
   * Get next digest time based on user preferences
   */
  private getNextDigestTime(userId: string): Date {
    // Daily digest at 9 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Mark notification as sent
   */
  private async markAsSent(notificationId: string): Promise<void> {
    await this.supabase
      .from('property_notifications')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', notificationId);
  }

  /**
   * Get today's notification count for user
   */
  private async getTodayNotificationCount(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, count } = await this.supabase
      .from('property_notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('sent_at', today.toISOString())
      .not('sent_at', 'is', null);

    return count || 0;
  }

  /**
   * Convert database preferences to UserPreferences type
   */
  private convertToUserPreferences(dbPrefs: any): UserPreferences {
    return {
      userId: dbPrefs.user_id,
      propertyTypes: dbPrefs.property_type ? [dbPrefs.property_type] : ['Single Family'],
      minBedrooms: dbPrefs.bedrooms_needed,
      minBathrooms: dbPrefs.bathrooms_needed,
      minSquareFeet: dbPrefs.min_square_footage,
      minLotSize: dbPrefs.min_lot_square_footage,
      priceMin: dbPrefs.price_range_min,
      priceMax: dbPrefs.price_range_max,
      cities: dbPrefs.city_preferences || [],
      zipCodes: dbPrefs.preferred_zip_codes || [],
      createdAt: new Date(dbPrefs.created_at),
      updatedAt: new Date(dbPrefs.updated_at)
    };
  }

  /**
   * Convert database record to NormalizedProperty
   */
  private dbToNormalized(dbRecord: any): NormalizedProperty {
    return {
      id: dbRecord.id,
      mlsNumber: dbRecord.mls_number,
      address: dbRecord.address,
      city: dbRecord.city,
      state: dbRecord.state,
      zipCode: dbRecord.zip_code,
      county: 'Maricopa',
      listPrice: dbRecord.list_price,
      status: dbRecord.status,
      propertyType: dbRecord.property_type,
      bedrooms: dbRecord.bedrooms,
      bathrooms: dbRecord.bathrooms,
      squareFeet: dbRecord.square_footage,
      lotSize: dbRecord.lot_size,
      yearBuilt: dbRecord.year_built,
      hasPool: dbRecord.has_pool,
      garageSpaces: dbRecord.garage_spaces,
      hasHOA: dbRecord.has_hoa,
      hoaFee: dbRecord.hoa_fee,
      primaryImageUrl: dbRecord.primary_image_url,
      dataSources: [dbRecord.data_source],
      lastScrapedAt: new Date(dbRecord.last_scraped_at || dbRecord.updated_at)
    };
  }
}

// Singleton instance
let propertyNotifierInstance: PropertyNotifier | null = null;

export function getPropertyNotifier(): PropertyNotifier {
  if (!propertyNotifierInstance) {
    propertyNotifierInstance = new PropertyNotifier();
  }
  return propertyNotifierInstance;
}