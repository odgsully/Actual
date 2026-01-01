/**
 * LIFX HTTP API Client
 *
 * Controls LIFX smart bulbs via the official REST API.
 * API Docs: https://api.developer.lifx.com/
 *
 * Requires LIFX_API_TOKEN environment variable.
 * Get your token at: https://cloud.lifx.com/settings
 */

const LIFX_API_BASE = 'https://api.lifx.com/v1';

// Types for LIFX API responses
export interface LIFXLight {
  id: string;
  uuid: string;
  label: string;
  connected: boolean;
  power: 'on' | 'off';
  color: {
    hue: number;
    saturation: number;
    kelvin: number;
  };
  brightness: number;
  group: {
    id: string;
    name: string;
  };
  location: {
    id: string;
    name: string;
  };
  product: {
    name: string;
    identifier: string;
    company: string;
    vendor_id: number;
    product_id: number;
    capabilities: {
      has_color: boolean;
      has_variable_color_temp: boolean;
      has_ir: boolean;
      has_chain: boolean;
      has_matrix: boolean;
      has_multizone: boolean;
      min_kelvin: number;
      max_kelvin: number;
    };
  };
  last_seen: string;
  seconds_since_seen: number;
  effect?: string;
}

export interface LIFXStateRequest {
  power?: 'on' | 'off';
  color?: string;
  brightness?: number;
  duration?: number;
  infrared?: number;
  fast?: boolean;
}

export interface LIFXEffectRequest {
  color?: string;
  from_color?: string;
  period?: number;
  cycles?: number;
  persist?: boolean;
  power_on?: boolean;
  peak?: number;
}

export interface LIFXResult {
  id: string;
  label: string;
  status: 'ok' | 'offline' | 'timed_out';
}

export interface LIFXResponse {
  results: LIFXResult[];
}

class LIFXClient {
  private token: string;

  constructor() {
    const token = process.env.LIFX_API_TOKEN;
    if (!token) {
      throw new Error('LIFX_API_TOKEN environment variable is required');
    }
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${LIFX_API_BASE}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LIFX API error: ${response.status} - ${error}`);
    }

    // Handle 202 Accepted (fast mode) with no body
    if (response.status === 202) {
      return { results: [] } as T;
    }

    return response.json();
  }

  /**
   * List all lights (or filter by selector)
   * Selector examples: 'all', 'id:d073d5xxxxxx', 'label:Office', 'group:Living Room'
   */
  async listLights(selector: string = 'all'): Promise<LIFXLight[]> {
    return this.request<LIFXLight[]>(`/lights/${encodeURIComponent(selector)}`);
  }

  /**
   * Set the state of lights
   */
  async setState(
    selector: string,
    state: LIFXStateRequest
  ): Promise<LIFXResponse> {
    return this.request<LIFXResponse>(
      `/lights/${encodeURIComponent(selector)}/state`,
      {
        method: 'PUT',
        body: JSON.stringify(state),
      }
    );
  }

  /**
   * Toggle power on/off
   * If any lights are on, turn them all off. If all are off, turn them on.
   */
  async togglePower(
    selector: string = 'all',
    duration?: number
  ): Promise<LIFXResponse> {
    const body = duration ? { duration } : {};
    return this.request<LIFXResponse>(
      `/lights/${encodeURIComponent(selector)}/toggle`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
  }

  /**
   * Turn lights on
   */
  async turnOn(selector: string = 'all', duration?: number): Promise<LIFXResponse> {
    return this.setState(selector, { power: 'on', duration });
  }

  /**
   * Turn lights off
   */
  async turnOff(selector: string = 'all', duration?: number): Promise<LIFXResponse> {
    return this.setState(selector, { power: 'off', duration });
  }

  /**
   * Set brightness (0-1)
   */
  async setBrightness(
    selector: string,
    brightness: number,
    duration?: number
  ): Promise<LIFXResponse> {
    return this.setState(selector, { brightness, duration });
  }

  /**
   * Set color
   * Color formats:
   * - Named: "red", "blue", "green"
   * - Hex: "#ff0000"
   * - HSB: "hue:120 saturation:1 brightness:1"
   * - Kelvin: "kelvin:2700" (warm white) to "kelvin:9000" (cool white)
   * - Named with modifiers: "blue saturation:0.5"
   */
  async setColor(
    selector: string,
    color: string,
    duration?: number
  ): Promise<LIFXResponse> {
    return this.setState(selector, { color, duration });
  }

  /**
   * Set color temperature (warm to cool white)
   * @param kelvin 2700 (warm) to 9000 (cool)
   */
  async setTemperature(
    selector: string,
    kelvin: number,
    duration?: number
  ): Promise<LIFXResponse> {
    return this.setState(selector, { color: `kelvin:${kelvin}`, duration });
  }

  /**
   * Breathe effect - slowly pulse between colors
   */
  async breathe(
    selector: string,
    color: string,
    options: LIFXEffectRequest = {}
  ): Promise<LIFXResponse> {
    return this.request<LIFXResponse>(
      `/lights/${encodeURIComponent(selector)}/effects/breathe`,
      {
        method: 'POST',
        body: JSON.stringify({ color, ...options }),
      }
    );
  }

  /**
   * Pulse effect - quickly flash between colors
   */
  async pulse(
    selector: string,
    color: string,
    options: LIFXEffectRequest = {}
  ): Promise<LIFXResponse> {
    return this.request<LIFXResponse>(
      `/lights/${encodeURIComponent(selector)}/effects/pulse`,
      {
        method: 'POST',
        body: JSON.stringify({ color, ...options }),
      }
    );
  }

  /**
   * Turn off any running effects
   */
  async effectsOff(
    selector: string = 'all',
    power_off?: boolean
  ): Promise<LIFXResponse> {
    return this.request<LIFXResponse>(
      `/lights/${encodeURIComponent(selector)}/effects/off`,
      {
        method: 'POST',
        body: JSON.stringify({ power_off }),
      }
    );
  }
}

// Singleton instance
let lifxClient: LIFXClient | null = null;

export function getLIFXClient(): LIFXClient {
  if (!lifxClient) {
    lifxClient = new LIFXClient();
  }
  return lifxClient;
}

// Preset colors for quick selection
export const LIFX_PRESET_COLORS = {
  // Whites
  'Warm White': 'kelvin:2700',
  'Soft White': 'kelvin:3000',
  'Neutral White': 'kelvin:4000',
  'Cool White': 'kelvin:5500',
  'Daylight': 'kelvin:6500',

  // Colors
  'Red': 'red',
  'Orange': 'orange',
  'Yellow': 'yellow',
  'Green': 'green',
  'Cyan': 'cyan',
  'Blue': 'blue',
  'Purple': 'purple',
  'Pink': 'pink',

  // Scenes
  'Relax': 'kelvin:2700 brightness:0.4',
  'Focus': 'kelvin:4000 brightness:1',
  'Energize': 'kelvin:6500 brightness:1',
  'Movie': 'kelvin:2700 brightness:0.2',
} as const;

export type LIFXPresetColor = keyof typeof LIFX_PRESET_COLORS;
