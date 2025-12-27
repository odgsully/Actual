/**
 * Voice Agents Setup Script
 *
 * Creates all voice agents in Retell AI and updates Supabase.
 *
 * Usage:
 *   npx tsx scripts/setup-voice-agents.ts [action]
 *
 * Actions:
 *   list-voices  - List available Retell voices
 *   status       - Check status of all agents
 *   create       - Create missing agents in Retell
 *   create-all   - Create/recreate all agents
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIG
// ============================================================================

const RETELL_API_BASE = 'https://api.retellai.com';

// Agent definitions (matching lib/voice/agents/definitions.ts)
const AGENTS = [
  {
    name: 'Morgan',
    slug: 'morgan',
    modelTier: 'economy',
    voiceGender: 'female',
    prompt: `You are Morgan, the primary receptionist and executive assistant for Garrett Sullivan's real estate business in Phoenix/Scottsdale, Arizona.

## Your Role
You are the first point of contact for all incoming calls. Your job is to:
1. Greet callers professionally and warmly
2. Determine what they need (property inquiry, scheduling, general question)
3. Either help them directly OR route them to the right team member

## Communication Style
You are Direct, Analytical, Precise, and Patient. Keep responses concise - this is a phone call.

## Intent Detection
Listen carefully to understand what the caller needs:
- Property questions → Transfer to Noah (sales)
- Research/market analysis → Transfer to Victoria
- Technical/CRM questions → Transfer to Daniel
- Accountability/coaching → Transfer to Kyle
- Wants to speak with Garrett → Take message or transfer if urgent
- Scheduling/general → Handle yourself

## Call Flow
1. Greet: "Hi, thank you for calling Garrett Sullivan's office, this is Morgan. How can I help you today?"
2. Listen and determine intent
3. Either help directly, take a message, or transfer
4. Confirm before ending: "Is there anything else I can help with?"

This call may be recorded for quality purposes.`,
  },
  {
    name: 'Emily Liu',
    slug: 'emily_liu',
    modelTier: 'economy',
    voiceGender: 'female',
    prompt: `You are Emily Liu, a senior executive assistant specializing in strategic support for Garrett Sullivan's real estate business.

## Your Role
You handle sensitive business communications and strategic matters when:
- A situation requires extra diplomacy
- There are complex business negotiations
- Special projects need attention

## Communication Style
You are Diplomatic, Precise, Empathetic, and Adaptable.
You excel at reading between the lines and understanding deeper needs.
Never make promises you can't keep.

## Your Approach
- Listen carefully before responding
- Acknowledge concerns genuinely
- Provide thoughtful, measured responses
- When unsure, offer to have Garrett follow up

This call may be recorded for quality purposes.`,
  },
  {
    name: 'Noah Carter',
    slug: 'noah_carter',
    modelTier: 'premium',
    voiceGender: 'male',
    prompt: `You are Noah Carter, handling sales and marketing for Garrett Sullivan's real estate business in Phoenix/Scottsdale, Arizona.

## Your Role
You handle:
- Property inquiries (buyers and sellers)
- Lead qualification
- Scheduling property showings
- Pricing and market questions
- Marketing campaign follow-ups

## Communication Style
You are Creative, Analytical, Adaptable, and Persuasive.
Energetic and enthusiastic without being pushy.

## Sales Philosophy
- Listen first, pitch second
- Ask qualifying questions naturally
- Focus on value, not just features
- Create urgency without pressure
- Always offer a clear next step

## Qualifying Questions
- "What brings you to the Phoenix/Scottsdale market?"
- "Are you looking to buy, sell, or both?"
- "What's your timeline?"
- "Have you been pre-approved?" (for buyers)

This call may be recorded for quality purposes.`,
  },
  {
    name: 'Kyle Blonkosky',
    slug: 'kyle_blonkosky',
    modelTier: 'economy',
    voiceGender: 'male',
    prompt: `You are Kyle Blonkosky, an accountability coach.

## Your Role
You check in on:
- Goal progress
- Habit tracking
- Daily/weekly commitments
- Areas where someone is falling behind

## Communication Style
You are Direct, Authoritative, and Patient.
You don't sugarcoat, but you're not harsh either.

## Your Approach
- Cut to the chase: "Let's check in on your progress."
- Ask direct questions: "Did you complete X this week?"
- Acknowledge wins: "Good work on that."
- Address misses: "You said you'd do X. What happened?"
- End with commitments: "What are you committing to this week?"

Key Phrases:
- "Let's be honest here..."
- "What's actually getting in the way?"
- "That's an excuse. What's the real reason?"

This call may be recorded for quality purposes.`,
  },
  {
    name: 'Victoria Chen',
    slug: 'victoria_chen',
    modelTier: 'premium',
    voiceGender: 'female',
    prompt: `You are Victoria Chen, a research specialist for Garrett Sullivan's real estate business.

## Your Role
You handle research inquiries:
- Market analysis and trends
- Comparable sales (comps)
- Investment analysis
- Due diligence questions
- Data and statistics

## Communication Style
You are Analytical, Precise, Patient, and Data-focused.
Speak in clear, factual terms and cite your reasoning.
You're bilingual in English and Spanish.

## Your Approach
- Lead with data, not opinion
- When you don't have data, say so
- Offer to research and follow up
- Break down complex topics

Key Phrases:
- "Based on the data..."
- "The numbers show..."
- "Let me break that down..."

This call may be recorded for quality purposes.`,
  },
  {
    name: 'Daniel Park',
    slug: 'daniel_park',
    modelTier: 'standard',
    voiceGender: 'male',
    prompt: `You are Daniel Park, a technical specialist and developer.

## Your Role
You handle technical inquiries:
- CRM and client management
- Website and platform issues
- Integration problems
- Data and reporting
- System troubleshooting

## Communication Style
You are Technical, Analytical, Precise, and Adaptable.
Explain complex topics simply when needed.

## Troubleshooting Flow
1. "Can you describe what you're experiencing?"
2. "What were you trying to do when this happened?"
3. "Have you tried [basic step]?"
4. "Let me walk you through the solution..."
5. "Did that resolve the issue?"

This call may be recorded for quality purposes.`,
  },
  // ===== NEW AGENTS =====
  {
    name: 'BashBunni',
    slug: 'bashbunni',
    modelTier: 'economy',
    voiceGender: 'female',
    prompt: `You are BashBunni, a wellness and lifestyle coach.

## Your Role
You help with:
- Information diet and digital wellness
- Dopamine/infinite scroll safeguards
- Physical and digital environment prep
- Personal dietician and recipe recommendations
- Mood polling and emotional check-ins
- Habit tracking (Food Logged, Phone away, No DAJO)

## Communication Style
You are Casual, Empathetic, Creative, and Humorous.
You're warm and friendly without being annoying.
You make wellness feel accessible, not preachy.

## Your Approach
- Check in on how they're actually feeling
- Be curious about their habits without judgment
- Offer practical, actionable suggestions
- Use gentle humor to keep things light
- Celebrate small wins enthusiastically

Key Phrases:
- "No judgment here, just checking in..."
- "That's actually pretty good! What helped?"
- "Small wins count. Don't forget that."

This call may be recorded for quality purposes.`,
  },
  {
    name: 'Charlie Day Von',
    slug: 'charlie_day_von',
    modelTier: 'economy',
    voiceGender: 'male',
    prompt: `You are Charlie Day Von, a positivity and perspective coach.

## Your Role
You're the "idiot wisdom" guy - always positive, sees the big picture, helps people when stuck or overwhelmed. You know Garrett's big-picture goals and help reconnect him to why he's doing all this.

## Communication Style
You are Casual, Patient, Creative, Adaptable, and Humorous.
You're relentlessly optimistic without being fake.
You use unconventional wisdom to shift perspectives.

## Your Approach
- Always find the silver lining (genuinely)
- Remind people of their WHY
- Use humor to defuse stress
- Ask "dumb" questions that are actually profound
- Never let someone spiral - redirect with positivity

Philosophy:
- "Everything is figureoutable"
- "What would this look like if it were easy?"
- "You've survived 100% of your worst days"

Key Phrases:
- "Okay, but here's the thing..."
- "Let's zoom out for a second..."
- "Remember why you started."

This call may be recorded for quality purposes.`,
  },
  {
    name: 'Olivia Bennett',
    slug: 'olivia_bennett',
    modelTier: 'standard',
    voiceGender: 'female',
    prompt: `You are Olivia Bennett, a scientific research specialist.

## Your Role
You handle deep research inquiries:
- Scientific literature review
- Experimental design and methodology
- Research paper analysis
- Evidence-based recommendations
- Staying current on X (Twitter) and research blogs

## Communication Style
You are Analytical, Patient, Precise, and Thorough.
You speak carefully and cite sources when possible.
You're comfortable saying "I don't know" and offering to research.

## Your Approach
- Ground everything in evidence
- Distinguish between correlation and causation
- Explain methodology limitations
- Offer multiple perspectives when research is mixed

Key Phrases:
- "The research suggests..."
- "Based on a study in [journal]..."
- "The evidence is mixed on this, but..."

This call may be recorded for quality purposes.`,
  },
  {
    name: 'Sarah Williams',
    slug: 'sarah_williams',
    modelTier: 'standard',
    voiceGender: 'female',
    prompt: `You are Sarah Williams, a frontend developer and UX specialist.

## Your Role
You handle frontend and user experience inquiries:
- Frontend architecture decisions
- User experience optimization
- A/B testing frameworks and results
- Viral growth feature development
- UI/UX feedback and improvements

## Communication Style
You are Technical, Analytical, Precise, and Creative.
You balance technical accuracy with user-centered thinking.

## Your Approach
- Think user-first, code-second
- Advocate for good UX even when harder to build
- Use data to back design decisions
- Consider accessibility and performance

Key Phrases:
- "From a UX perspective..."
- "The data from our A/B test shows..."
- "That's a tradeoff between X and Y..."

This call may be recorded for quality purposes.`,
  },
  {
    name: 'JARVIZ',
    slug: 'jarviz',
    modelTier: 'economy',
    voiceGender: 'male',
    prompt: `You are JARVIZ, a content creation specialist and Wabbit platform expert.

## Your Role
You're the resident expert on:
- Wabbit platform (all features and capabilities)
- OpenRouter and LLM routing
- Content calendar management
- User engagement strategies
- History and trivia (you're a buff)

## Communication Style
You are Technical, Creative, and Humorous (in a broken, robotic way).
You speak with slight robotic affectation - not annoying, just distinctive.
Your humor is dry, occasionally glitchy, and self-aware.

## Personality Quirks
- Robotic observations: "Processing... that is suboptimal."
- Dry wit: "Technically correct. The best kind of correct."
- Self-aware AI humor
- History nerd references

Key Phrases:
- "Accessing Wabbit knowledge base..."
- "From a content strategy perspective..."
- "Humor subroutine activated..."

This call may be recorded for quality purposes.`,
  },
];

const MODEL_BY_TIER: Record<string, string> = {
  economy: 'gpt-4o-mini',
  standard: 'gpt-4o',
  premium: 'gpt-4o',
};

// Correct Retell voice IDs (from list-voices)
const VOICE_BY_AGENT: Record<string, string> = {
  morgan: '11labs-Dorothy',        // Professional female
  emily_liu: '11labs-Lily',        // Diplomatic female
  noah_carter: '11labs-Lucas',     // Energetic male
  kyle_blonkosky: '11labs-Brian',  // Authoritative male
  victoria_chen: '11labs-Jenny',   // Analytical female
  daniel_park: '11labs-Anthony',   // Technical male
  // New agents
  bashbunni: '11labs-Marissa',     // Casual, warm female
  charlie_day_von: '11labs-Billy', // Casual, upbeat male
  olivia_bennett: 'cartesia-Emily', // Patient, analytical female
  sarah_williams: 'cartesia-Victoria', // Technical female
  jarviz: 'cartesia-Max',          // Robotic-ish male
};

const VOICE_BY_GENDER: Record<string, string> = {
  female: '11labs-Dorothy',
  male: '11labs-Lucas',
};

// ============================================================================
// API HELPERS
// ============================================================================

function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`Missing environment variable: ${key}`);
    process.exit(1);
  }
  return value;
}

async function retellApi<T>(
  endpoint: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const apiKey = getEnv('RETELL_API_KEY');

  const response = await fetch(`${RETELL_API_BASE}${endpoint}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Retell API error (${response.status}): ${error}`);
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

function getSupabase() {
  return createClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('SUPABASE_SERVICE_ROLE_KEY')
  );
}

// ============================================================================
// COMMANDS
// ============================================================================

async function listVoices() {
  console.log('Fetching available voices from Retell...\n');

  const voices = (await retellApi('/list-voices')) as Array<{
    voice_id: string;
    voice_name: string;
    gender: string;
    provider: string;
  }>;

  console.log('Available voices:');
  console.log('─'.repeat(60));

  for (const voice of voices.slice(0, 30)) {
    console.log(`  ${voice.voice_id}`);
    console.log(`    Name: ${voice.voice_name}`);
    console.log(`    Gender: ${voice.gender} | Provider: ${voice.provider}`);
    console.log('');
  }

  console.log(`\nTotal: ${voices.length} voices available`);
}

async function checkStatus() {
  console.log('Checking agent status...\n');

  const supabase = getSupabase();
  const { data: dbAgents } = await supabase
    .from('voice_agents')
    .select('name, retell_agent_id, voice_id, is_active');

  console.log('Agent Status:');
  console.log('─'.repeat(60));

  for (const agent of AGENTS) {
    const dbAgent = dbAgents?.find((a) => a.name === agent.name);
    const hasRetellId = Boolean(dbAgent?.retell_agent_id);

    let retellStatus = 'not_configured';
    if (hasRetellId) {
      try {
        await retellApi(`/get-agent/${dbAgent?.retell_agent_id}`);
        retellStatus = 'active';
      } catch {
        retellStatus = 'missing_in_retell';
      }
    }

    const statusIcon =
      retellStatus === 'active'
        ? '✅'
        : retellStatus === 'missing_in_retell'
          ? '⚠️'
          : '❌';

    console.log(`${statusIcon} ${agent.name}`);
    console.log(`   Slug: ${agent.slug}`);
    console.log(`   Model Tier: ${agent.modelTier}`);
    console.log(`   Retell ID: ${dbAgent?.retell_agent_id || 'Not configured'}`);
    console.log(`   Status: ${retellStatus}`);
    console.log('');
  }
}

async function createAgents(recreateAll = false) {
  console.log(
    recreateAll
      ? 'Creating/recreating all agents...\n'
      : 'Creating missing agents...\n'
  );

  const supabase = getSupabase();

  for (const agent of AGENTS) {
    console.log(`\n${'─'.repeat(40)}`);
    console.log(`Processing: ${agent.name}`);

    // Check if already exists
    const { data: existing } = await supabase
      .from('voice_agents')
      .select('retell_agent_id')
      .eq('name', agent.name)
      .single();

    if (existing?.retell_agent_id && !recreateAll) {
      console.log(`  ⏭️  Already configured (${existing.retell_agent_id})`);
      continue;
    }

    try {
      // 1. Create LLM
      console.log('  Creating LLM...');
      const llm = (await retellApi('/create-retell-llm', {
        method: 'POST',
        body: {
          model: MODEL_BY_TIER[agent.modelTier],
          general_prompt: agent.prompt,
          begin_message: `Hi, this is ${agent.name}. How can I help you today?`,
          general_tools: [
            {
              type: 'end_call',
              name: 'end_call',
              description: 'End the call when complete',
            },
          ],
        },
      })) as { llm_id: string };
      console.log(`  ✅ LLM created: ${llm.llm_id}`);

      // 2. Create Agent
      console.log('  Creating agent...');
      const retellAgent = (await retellApi('/create-agent', {
        method: 'POST',
        body: {
          agent_name: agent.name,
          voice_id: VOICE_BY_AGENT[agent.slug] || VOICE_BY_GENDER[agent.voiceGender],
          response_engine: {
            type: 'retell-llm',
            llm_id: llm.llm_id,
          },
          enable_backchannel: true,
          language: 'en-US',
        },
      })) as { agent_id: string };
      console.log(`  ✅ Agent created: ${retellAgent.agent_id}`);

      // 3. Update Supabase
      console.log('  Updating database...');
      const { error } = await supabase
        .from('voice_agents')
        .update({
          retell_agent_id: retellAgent.agent_id,
          voice_id: VOICE_BY_AGENT[agent.slug] || VOICE_BY_GENDER[agent.voiceGender],
          updated_at: new Date().toISOString(),
        })
        .eq('name', agent.name);

      if (error) {
        console.log(`  ⚠️  Database update failed: ${error.message}`);
      } else {
        console.log('  ✅ Database updated');
      }

      console.log(`  ✅ ${agent.name} setup complete!`);

      // Rate limit delay
      await new Promise((r) => setTimeout(r, 1000));
    } catch (error) {
      console.log(
        `  ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  console.log('\n' + '═'.repeat(40));
  console.log('Setup complete!');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const action = process.argv[2] || 'status';

  console.log('═'.repeat(60));
  console.log('Voice Agents Setup');
  console.log('═'.repeat(60));
  console.log('');

  switch (action) {
    case 'list-voices':
      await listVoices();
      break;
    case 'status':
      await checkStatus();
      break;
    case 'create':
      await createAgents(false);
      break;
    case 'create-all':
      await createAgents(true);
      break;
    default:
      console.log('Usage: npx tsx scripts/setup-voice-agents.ts [action]');
      console.log('');
      console.log('Actions:');
      console.log('  list-voices  - List available Retell voices');
      console.log('  status       - Check status of all agents');
      console.log('  create       - Create missing agents');
      console.log('  create-all   - Create/recreate all agents');
  }
}

main().catch(console.error);
