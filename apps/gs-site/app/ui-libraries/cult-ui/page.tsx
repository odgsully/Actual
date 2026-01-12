"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ExternalLink, Copy, Check, Sparkles } from "lucide-react"

// Installed CultUI Components
import { TextureButton } from "@/components/ui/texture-button"
import {
  TextureCard,
  TextureCardContent,
  TextureCardHeader,
  TextureCardTitle,
  TextureCardDescription,
  TextureCardFooter,
  TextureSeparator,
} from "@/components/ui/texture-card"
import { GradientHeading } from "@/components/ui/gradient-heading"
import { TextAnimate } from "@/components/ui/text-animate"
import { AnimatedNumber } from "@/components/ui/animated-number"
import {
  DynamicIsland,
  DynamicIslandProvider,
  DynamicContainer,
  DynamicTitle,
  DynamicDescription,
  useDynamicIslandSize,
  SIZE_PRESETS,
} from "@/components/ui/dynamic-island"
import { DirectionAwareTabs } from "@/components/ui/direction-aware-tabs"
import { Typewriter } from "@/components/ui/typewriter"
import { BgAnimateButton } from "@/components/ui/bg-animate-button"
import { MinimalCard, MinimalCardDescription, MinimalCardImage, MinimalCardTitle } from "@/components/ui/minimal-card"
import { LightBoard } from "@/components/ui/lightboard"
// Newly tracked installed components
import NeumorphButton from "@/components/ui/neumorph-button"
import { FamilyButton } from "@/components/ui/family-button"
import { NeumorphEyebrow } from "@/components/ui/neumorph-eyebrow"
import { ShiftCard } from "@/components/ui/shift-card"
import { TextureOverlay, type TextureType } from "@/components/ui/texture-overlay"
import { DistortedGlass } from "@/components/ui/distorted-glass"
import {
  ExpandableScreen,
  ExpandableScreenTrigger,
  ExpandableScreenContent,
} from "@/components/ui/expandable-screen"

// Component categories for the full CultUI library (49 total)
const CULT_UI_COMPONENTS = {
  "Buttons & Controls": [
    { name: "Texture Button", installed: true, slug: "texture-button" },
    { name: "BG Animate Button", installed: true, slug: "bg-animate-button" },
    { name: "Neumorph Button", installed: true, slug: "neumorph-button" },
    { name: "Family Button", installed: true, slug: "family-button" },
    { name: "Family Drawer", installed: true, slug: "family-drawer" },
  ],
  "Cards & Containers": [
    { name: "Texture Card", installed: true, slug: "texture-card" },
    { name: "Minimal Card", installed: true, slug: "minimal-card" },
    { name: "Expandable Card", installed: false, slug: "expandable" },
    { name: "Expandable Screen", installed: true, slug: "expandable-screen" },
    { name: "Neumorph Eyebrow", installed: true, slug: "neumorph-eyebrow" },
    { name: "Shift Card", installed: true, slug: "shift-card" },
    { name: "Browser Window", installed: false, slug: "mock-browser-window" },
    { name: "Texture Overlay", installed: true, slug: "texture-overlay" },
    { name: "Distorted Glass", installed: true, slug: "distorted-glass" },
    { name: "Background Texture", installed: false, slug: "bg-image-texture" },
  ],
  "Layout & Forms": [
    { name: "Direction Aware Tabs", installed: true, slug: "direction-aware-tabs" },
    { name: "Morph Surface", installed: false, slug: "morph-surface" },
    { name: "Side Panel", installed: false, slug: "side-panel" },
    { name: "Floating Panel", installed: false, slug: "floating-panel" },
    { name: "Popover", installed: false, slug: "popover" },
    { name: "Popover Form", installed: false, slug: "popover-form" },
    { name: "Sortable List", installed: false, slug: "sortable-list" },
    { name: "Toolbar Expandable", installed: false, slug: "toolbar-expandable" },
    { name: "Code Block", installed: false, slug: "code-block" },
  ],
  "Interactive Elements": [
    { name: "Dynamic Island", installed: true, slug: "dynamic-island" },
    { name: "Color Picker", installed: false, slug: "color-picker" },
    { name: "Timer", installed: false, slug: "timer" },
    { name: "MacOS Dock", installed: false, slug: "dock" },
    { name: "Squiggle Arrow", installed: false, slug: "squiggle-arrow" },
  ],
  "Typography & Text": [
    { name: "Gradient Heading", installed: true, slug: "gradient-heading" },
    { name: "Text Animate", installed: true, slug: "text-animate" },
    { name: "Typewriter", installed: true, slug: "typewriter" },
    { name: "Animated Number", installed: true, slug: "animated-number" },
    { name: "Text Gif", installed: false, slug: "text-gif" },
  ],
  "Visual Effects": [
    { name: "LightBoard", installed: true, slug: "lightboard" },
    { name: "Fractal Grid", installed: false, slug: "bg-animated-fractal-dot-grid" },
    { name: "Canvas Fractal Grid", installed: false, slug: "canvas-fractal-grid" },
    { name: "Shader Lens Blur", installed: false, slug: "shader-lens-blur" },
  ],
  "Onboarding & Tours": [
    { name: "Feature Carousel", installed: false, slug: "feature-carousel" },
    { name: "Intro Disclosure", installed: false, slug: "intro-disclosure" },
    { name: "Loading Carousel", installed: false, slug: "loading-carousel" },
  ],
  Media: [
    { name: "Stripe BG Guides", installed: false, slug: "stripe-bg-guides" },
    { name: "Logo Carousel", installed: false, slug: "logo-carousel" },
    { name: "3D Carousel", installed: false, slug: "three-d-carousel" },
    { name: "Hover Video Player", installed: false, slug: "hover-video-player" },
    { name: "BG Media Hero", installed: false, slug: "bg-media" },
    { name: "Tweet Grid", installed: false, slug: "tweet-grid" },
    { name: "YouTube Video Player", installed: false, slug: "youtube-video-player" },
  ],
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="p-1.5 rounded-md hover:bg-muted transition-colors"
      title="Copy install command"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  )
}

// Dynamic Island Demo Component
function DynamicIslandDemo() {
  const { setSize } = useDynamicIslandSize()
  const [currentSize, setCurrentSize] = useState<string>("default")

  const sizes = [
    { key: "default", label: "Default" },
    { key: "compact", label: "Compact" },
    { key: "large", label: "Large" },
    { key: "tall", label: "Tall" },
    { key: "medium", label: "Medium" },
  ]

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <DynamicIsland id="demo-island">
        <DynamicContainer className="flex items-center justify-center h-full px-4">
          <DynamicTitle className="text-white text-sm font-medium">
            Dynamic Island
          </DynamicTitle>
          <DynamicDescription className="text-white/70 text-xs ml-2">
            Click buttons below
          </DynamicDescription>
        </DynamicContainer>
      </DynamicIsland>

      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {sizes.map((size) => (
          <button
            key={size.key}
            onClick={() => {
              setSize(size.key as any)
              setCurrentSize(size.key)
            }}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              currentSize === size.key
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-foreground border-border hover:bg-muted"
            }`}
          >
            {size.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function CultUIShowcase() {
  const [animatedValue, setAnimatedValue] = useState(1234)
  const [selectedTab, setSelectedTab] = useState(0)

  const tabs = [
    { id: 0, label: "Overview" },
    { id: 1, label: "Components" },
    { id: 2, label: "Install" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/private/gs-site"
              className="p-2 rounded-md hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-medium text-foreground tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                CultUI Component Library
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                49 beautiful components for React
              </p>
            </div>
            <a
              href="https://cult-ui.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>cult-ui.com</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-12">
        {/* Installation Info */}
        <section className="p-4 rounded-lg border border-border bg-card">
          <h2 className="text-sm font-medium mb-2">Installation</h2>
          <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2 font-mono text-sm">
            <code className="flex-1 text-muted-foreground">
              npx shadcn@latest add &quot;https://cult-ui.com/r/[component].json&quot;
            </code>
            <CopyButton text='npx shadcn@latest add "https://cult-ui.com/r/[component].json"' />
          </div>
        </section>

        {/* SECTION: Buttons & Controls */}
        <section>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Buttons & Controls
          </h2>

          <div className="grid gap-8">
            {/* Texture Button */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Texture Button</h3>
              <div className="flex flex-wrap gap-4 mb-4">
                <TextureButton variant="primary">Primary</TextureButton>
                <TextureButton variant="secondary">Secondary</TextureButton>
                <TextureButton variant="accent">Accent</TextureButton>
                <TextureButton variant="destructive">Destructive</TextureButton>
                <TextureButton variant="minimal">Minimal</TextureButton>
              </div>
              <div className="flex flex-wrap gap-4">
                <TextureButton variant="primary" size="sm">Small</TextureButton>
                <TextureButton variant="primary" size="default">Default</TextureButton>
                <TextureButton variant="primary" size="lg">Large</TextureButton>
              </div>
            </div>

            {/* BG Animate Button */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">BG Animate Button (Animated Gradients)</h3>
              <div className="flex flex-wrap gap-4">
                <BgAnimateButton gradient="default" animation="spin">Default</BgAnimateButton>
                <BgAnimateButton gradient="ocean" animation="spin">Ocean</BgAnimateButton>
                <BgAnimateButton gradient="candy" animation="spin-fast">Candy</BgAnimateButton>
                <BgAnimateButton gradient="forest" animation="spin-slow">Forest</BgAnimateButton>
                <BgAnimateButton gradient="sunset" animation="spin">Sunset</BgAnimateButton>
                <BgAnimateButton gradient="nebula" animation="pulse">Nebula</BgAnimateButton>
              </div>
            </div>

            {/* Neumorph Button */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Neumorph Button (Soft Shadow Design)</h3>
              <div className="flex flex-wrap gap-4 mb-4">
                <NeumorphButton intent="default">Default</NeumorphButton>
                <NeumorphButton intent="primary">Primary</NeumorphButton>
                <NeumorphButton intent="secondary">Secondary</NeumorphButton>
                <NeumorphButton intent="danger">Danger</NeumorphButton>
              </div>
              <div className="flex flex-wrap gap-4">
                <NeumorphButton intent="primary" size="small">Small</NeumorphButton>
                <NeumorphButton intent="primary" size="medium">Medium</NeumorphButton>
                <NeumorphButton intent="primary" size="large">Large</NeumorphButton>
                <NeumorphButton intent="primary" loading>Loading</NeumorphButton>
              </div>
            </div>

            {/* Family Button */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Family Button (Expandable Floating Button)</h3>
              <div className="flex justify-center py-8">
                <FamilyButton>
                  <div className="flex flex-col items-center gap-3 p-4">
                    <p className="text-sm font-medium text-white">Quick Actions</p>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
                        Share
                      </button>
                      <button className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
                        Save
                      </button>
                    </div>
                  </div>
                </FamilyButton>
              </div>
              <p className="text-xs text-muted-foreground text-center">Click the + button to expand</p>
            </div>
          </div>
        </section>

        {/* SECTION: Cards & Containers */}
        <section>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Cards & Containers
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Texture Card */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Texture Card</h3>
              <TextureCard className="max-w-sm">
                <TextureCardHeader className="px-6">
                  <TextureCardTitle>Texture Card</TextureCardTitle>
                  <TextureCardDescription>
                    A beautiful card with layered borders
                  </TextureCardDescription>
                </TextureCardHeader>
                <TextureSeparator />
                <TextureCardContent>
                  <p className="text-sm text-muted-foreground">
                    This card features multiple nested borders that create a premium,
                    textured appearance with subtle gradients.
                  </p>
                </TextureCardContent>
                <TextureSeparator />
                <TextureCardFooter>
                  <TextureButton variant="minimal" size="sm">Cancel</TextureButton>
                  <TextureButton variant="primary" size="sm">Save</TextureButton>
                </TextureCardFooter>
              </TextureCard>
            </div>

            {/* Minimal Card */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Minimal Card</h3>
              <MinimalCard className="max-w-sm">
                <MinimalCardImage
                  src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=200&fit=crop"
                  alt="Gradient background"
                />
                <MinimalCardTitle>Minimal Card</MinimalCardTitle>
                <MinimalCardDescription>
                  A clean, minimal card component with image support
                </MinimalCardDescription>
              </MinimalCard>
            </div>

            {/* Shift Card */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Shift Card (Hover to Reveal)</h3>
              <div className="flex justify-center">
                <ShiftCard
                  topContent={
                    <NeumorphEyebrow intent="primary">Featured</NeumorphEyebrow>
                  }
                  topAnimateContent={
                    <p className="text-xs text-muted-foreground mt-1">Premium content unlocked</p>
                  }
                  middleContent={
                    <div className="text-center">
                      <p className="text-4xl font-bold">42</p>
                      <p className="text-sm text-muted-foreground">Active Projects</p>
                    </div>
                  }
                  bottomContent={
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium mb-2">Project Details</p>
                      <p className="text-xs text-muted-foreground">
                        Hover reveals more information with smooth animation transitions.
                      </p>
                    </div>
                  }
                />
              </div>
            </div>

            {/* Neumorph Eyebrow */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Neumorph Eyebrow (Labels)</h3>
              <div className="flex flex-wrap gap-3">
                <NeumorphEyebrow intent="default">Default</NeumorphEyebrow>
                <NeumorphEyebrow intent="primary">Primary</NeumorphEyebrow>
                <NeumorphEyebrow intent="secondary">Secondary</NeumorphEyebrow>
              </div>
            </div>

            {/* Expandable Screen */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Expandable Screen (Click to Expand)</h3>
              <div className="flex justify-center">
                <ExpandableScreen layoutId="demo-expandable">
                  <ExpandableScreenTrigger>
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                      <span className="text-white font-medium">Click Me</span>
                    </div>
                  </ExpandableScreenTrigger>
                  <ExpandableScreenContent className="bg-gradient-to-br from-purple-600 to-blue-600">
                    <div className="flex flex-col items-center justify-center h-full p-8 text-white">
                      <h2 className="text-3xl font-bold mb-4">Expanded View</h2>
                      <p className="text-lg text-white/80 text-center max-w-md">
                        This component morphs from a small trigger to a full-screen overlay with smooth animations.
                      </p>
                    </div>
                  </ExpandableScreenContent>
                </ExpandableScreen>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: Typography & Text */}
        <section>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Typography & Text
          </h2>

          <div className="grid gap-8">
            {/* Gradient Heading */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Gradient Heading</h3>
              <div className="space-y-4">
                <GradientHeading variant="default" size="lg">
                  Default Gradient
                </GradientHeading>
                <GradientHeading variant="pink" size="md">
                  Pink Accent Gradient
                </GradientHeading>
                <GradientHeading variant="secondary" size="sm">
                  Secondary Gradient
                </GradientHeading>
              </div>
            </div>

            {/* Text Animate */}
            <div className="p-6 rounded-lg border border-border bg-card overflow-hidden">
              <h3 className="text-sm font-medium mb-4">Text Animate</h3>
              <TextAnimate text="Animated Text Effect" type="fadeInUp" />
            </div>

            {/* Typewriter */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Typewriter</h3>
              <div className="text-2xl font-bold">
                <Typewriter
                  delay={0.5}
                  baseText="Build "
                  texts={[
                    "beautiful interfaces",
                    "stunning animations",
                    "modern web apps",
                    "amazing experiences",
                  ]}
                />
              </div>
            </div>

            {/* Animated Number */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Animated Number</h3>
              <div className="flex items-center gap-6">
                <div className="text-4xl font-bold tabular-nums">
                  <AnimatedNumber value={animatedValue} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAnimatedValue((v) => v + 100)}
                    className="px-3 py-1.5 text-sm rounded-md bg-muted hover:bg-muted/80 transition-colors"
                  >
                    +100
                  </button>
                  <button
                    onClick={() => setAnimatedValue((v) => Math.max(0, v - 100))}
                    className="px-3 py-1.5 text-sm rounded-md bg-muted hover:bg-muted/80 transition-colors"
                  >
                    -100
                  </button>
                  <button
                    onClick={() => setAnimatedValue(Math.floor(Math.random() * 10000))}
                    className="px-3 py-1.5 text-sm rounded-md bg-muted hover:bg-muted/80 transition-colors"
                  >
                    Random
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: Interactive Elements */}
        <section>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            Interactive Elements
          </h2>

          <div className="grid gap-8">
            {/* Dynamic Island */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Dynamic Island (Apple-style)</h3>
              <DynamicIslandProvider initialSize="default">
                <DynamicIslandDemo />
              </DynamicIslandProvider>
            </div>
          </div>
        </section>

        {/* SECTION: Layout & Forms */}
        <section>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            Layout & Forms
          </h2>

          <div className="grid gap-8">
            {/* Direction Aware Tabs */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Direction Aware Tabs</h3>
              <DirectionAwareTabs
                tabs={[
                  { id: 0, label: "Overview", content: <div className="p-4 text-center text-muted-foreground">Overview content with smooth directional transitions</div> },
                  { id: 1, label: "Analytics", content: <div className="p-4 text-center text-muted-foreground">Analytics dashboard would go here</div> },
                  { id: 2, label: "Reports", content: <div className="p-4 text-center text-muted-foreground">Reports section with charts and data</div> },
                  { id: 3, label: "Settings", content: <div className="p-4 text-center text-muted-foreground">Settings and configuration options</div> },
                ]}
              />
            </div>
          </div>
        </section>

        {/* SECTION: Visual Effects */}
        <section>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500" />
            Visual Effects
          </h2>

          <div className="grid gap-8">
            {/* Lightboard */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Lightboard (Interactive LED Display)</h3>
              <div className="h-64 rounded-lg overflow-hidden bg-neutral-900">
                <LightBoard
                  rows={12}
                  text="CULT UI"
                  lightSize={8}
                  gap={2}
                  colors={{
                    textBright: "rgba(168, 85, 247, 0.9)",
                    textDim: "rgba(168, 85, 247, 0.4)",
                    drawLine: "rgba(168, 85, 247, 0.7)",
                    background: "rgba(30, 30, 40, 0.3)",
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Try drawing on the board with your mouse!</p>
            </div>

            {/* Texture Overlay */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Texture Overlay (14 CSS Patterns)</h3>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                {(["dots", "grid", "noise", "crosshatch", "diagonal", "halftone", "chevron", "paperGrain", "horizontalLines", "verticalLines", "scatteredDots", "triangular"] as TextureType[]).map((texture) => (
                  <div
                    key={texture}
                    className="relative h-16 rounded-lg bg-gradient-to-br from-purple-400 to-blue-500 overflow-hidden"
                  >
                    <TextureOverlay texture={texture} opacity={0.5} />
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-medium">
                      {texture}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Distorted Glass */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Distorted Glass (Frosted Effect)</h3>
              <div className="relative h-48 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-2xl font-bold text-white">Background Content</p>
                </div>
                <div className="absolute bottom-0 left-0 right-0">
                  <DistortedGlass className="!w-full !block" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Uses SVG filters for realistic glass distortion</p>
            </div>
          </div>
        </section>

        {/* SECTION: All Components Reference */}
        <section>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-500" />
            All Components ({Object.values(CULT_UI_COMPONENTS).flat().length} total)
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(CULT_UI_COMPONENTS).map(([category, components]) => (
              <div
                key={category}
                className="p-4 rounded-lg border border-border bg-card"
              >
                <h3 className="text-sm font-medium mb-3">{category}</h3>
                <ul className="space-y-2">
                  {components.map((comp) => (
                    <li
                      key={comp.slug}
                      className="flex items-center justify-between text-sm"
                    >
                      <span
                        className={
                          comp.installed
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {comp.name}
                      </span>
                      {comp.installed ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                          Installed
                        </span>
                      ) : (
                        <CopyButton
                          text={`npx shadcn@latest add "https://cult-ui.com/r/${comp.slug}.json"`}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>CultUI Component Showcase</span>
            <a
              href="https://github.com/nolly-studio/cult-ui"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              GitHub
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
