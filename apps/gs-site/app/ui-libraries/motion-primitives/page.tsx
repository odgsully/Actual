"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ExternalLink, Copy, Check, Zap } from "lucide-react"

// Installed Motion-Primitives Components
import { TextShimmer } from "@/components/motion-primitives/text-shimmer"
import { TextEffect } from "@/components/motion-primitives/text-effect"
import { SpinningText } from "@/components/motion-primitives/spinning-text"
import { BorderTrail } from "@/components/motion-primitives/border-trail"
import { AnimatedGroup } from "@/components/motion-primitives/animated-group"
import { InView } from "@/components/motion-primitives/in-view"
import { TransitionPanel } from "@/components/motion-primitives/transition-panel"
// Newly tracked installed components
import { TextLoop } from "@/components/motion-primitives/text-loop"
import { TextMorph } from "@/components/motion-primitives/text-morph"
import { TextRoll } from "@/components/motion-primitives/text-roll"
import { TextScramble } from "@/components/motion-primitives/text-scramble"
import { TextShimmerWave } from "@/components/motion-primitives/text-shimmer-wave"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/motion-primitives/accordion"
import { Carousel, CarouselContent, CarouselItem, CarouselNavigation, CarouselIndicator } from "@/components/motion-primitives/carousel"
import { Disclosure, DisclosureTrigger, DisclosureContent } from "@/components/motion-primitives/disclosure"
import { AnimatedBackground } from "@/components/motion-primitives/animated-background"

// Component categories for the full Motion-Primitives library (34 total)
const MOTION_PRIMITIVES_COMPONENTS = {
  "Text Effects": [
    { name: "Text Effect", installed: true, slug: "text-effect" },
    { name: "Text Loop", installed: true, slug: "text-loop" },
    { name: "Text Morph", installed: true, slug: "text-morph" },
    { name: "Text Roll", installed: true, slug: "text-roll" },
    { name: "Text Scramble", installed: true, slug: "text-scramble" },
    { name: "Text Shimmer", installed: true, slug: "text-shimmer" },
    { name: "Text Shimmer Wave", installed: true, slug: "text-shimmer-wave" },
  ],
  "Core Components": [
    { name: "Accordion", installed: true, slug: "accordion" },
    { name: "Animated Background", installed: true, slug: "animated-background" },
    { name: "Animated Group", installed: true, slug: "animated-group" },
    { name: "Border Trail", installed: true, slug: "border-trail" },
    { name: "Carousel", installed: true, slug: "carousel" },
    { name: "Cursor", installed: false, slug: "cursor" },
    { name: "Dialog", installed: true, slug: "dialog" },
    { name: "Disclosure", installed: true, slug: "disclosure" },
    { name: "In View", installed: true, slug: "in-view" },
    { name: "Infinite Slider", installed: false, slug: "infinite-slider" },
    { name: "Transition Panel", installed: true, slug: "transition-panel" },
  ],
  "Number Effects": [
    { name: "Animated Number", installed: false, slug: "animated-number" },
    { name: "Sliding Number", installed: false, slug: "sliding-number" },
  ],
  "Interactive Elements": [
    { name: "Dock", installed: false, slug: "dock" },
    { name: "Glow Effect", installed: false, slug: "glow-effect" },
    { name: "Image Comparison", installed: false, slug: "image-comparison" },
    { name: "Scroll Progress", installed: false, slug: "scroll-progress" },
    { name: "Spotlight", installed: false, slug: "spotlight" },
    { name: "Spinning Text", installed: true, slug: "spinning-text" },
    { name: "Tilt", installed: false, slug: "tilt" },
  ],
  Toolbars: [
    { name: "Toolbar Dynamic", installed: false, slug: "toolbar-dynamic" },
    { name: "Toolbar Expandable", installed: false, slug: "toolbar-expandable" },
  ],
  "Advanced Effects": [
    { name: "Magnetic", installed: false, slug: "magnetic" },
    { name: "Morphing Dialog", installed: false, slug: "morphing-dialog" },
    { name: "Morphing Popover", installed: false, slug: "morphing-popover" },
    { name: "Progressive Blur", installed: false, slug: "progressive-blur" },
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

// Text Morph Demo Component
function TextMorphDemo() {
  const [text, setText] = useState("Motion")
  const words = ["Motion", "Animation", "Effects", "Magic"]

  return (
    <div className="space-y-4">
      <TextMorph className="text-3xl font-bold">{text}</TextMorph>
      <div className="flex gap-2">
        {words.map((word) => (
          <button
            key={word}
            onClick={() => setText(word)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              text === word ? "bg-foreground text-background" : "bg-muted hover:bg-muted/80"
            }`}
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  )
}

// Text Roll Demo Component
function TextRollDemo() {
  const [key, setKey] = useState(0)

  return (
    <div className="space-y-4">
      <TextRoll key={key} className="text-3xl font-bold">
        Rolling Text
      </TextRoll>
      <button
        onClick={() => setKey((k) => k + 1)}
        className="px-4 py-2 text-sm rounded-md bg-muted hover:bg-muted/80 transition-colors"
      >
        Replay Animation
      </button>
    </div>
  )
}

// Text Scramble Demo Component
function TextScrambleDemo() {
  const [trigger, setTrigger] = useState(true)

  return (
    <div className="space-y-4">
      <TextScramble
        className="text-3xl font-bold font-mono"
        trigger={trigger}
        duration={1}
      >
        DECODING MESSAGE
      </TextScramble>
      <button
        onClick={() => {
          setTrigger(false)
          setTimeout(() => setTrigger(true), 100)
        }}
        className="px-4 py-2 text-sm rounded-md bg-muted hover:bg-muted/80 transition-colors"
      >
        Replay Scramble
      </button>
    </div>
  )
}

// Disclosure Demo Component
function DisclosureDemo() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Disclosure open={isOpen} onOpenChange={setIsOpen}>
      <DisclosureTrigger>
        <div className="flex items-center justify-between w-full px-4 py-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
          <span className="font-medium">Click to {isOpen ? "collapse" : "expand"}</span>
          <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
        </div>
      </DisclosureTrigger>
      <DisclosureContent>
        <div className="px-4 py-3 mt-2 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            This is the collapsible content. It smoothly animates in and out with customizable
            transitions. Great for FAQs, expandable sections, and progressive disclosure patterns.
          </p>
        </div>
      </DisclosureContent>
    </Disclosure>
  )
}

export default function MotionPrimitivesShowcase() {
  const [textEffectKey, setTextEffectKey] = useState(0)
  const [activePanel, setActivePanel] = useState(0)

  const panels = [
    { title: "Overview", content: "This is the overview panel. Motion-Primitives provides beautiful animation components for React." },
    { title: "Features", content: "120fps GPU-accelerated animations, gesture support, spring physics, and more." },
    { title: "Installation", content: "Install via CLI: npx motion-primitives@latest add [component]" },
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
                <Zap className="w-5 h-5 text-yellow-500" />
                Motion-Primitives
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                34 animation components for React
              </p>
            </div>
            <a
              href="https://motion-primitives.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>motion-primitives.com</span>
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
              npx motion-primitives@latest add [component]
            </code>
            <CopyButton text="npx motion-primitives@latest add [component]" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Requires: <code className="bg-muted px-1 rounded">motion</code> (Framer Motion successor)
          </p>
        </section>

        {/* SECTION: Text Effects */}
        <section>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            Text Effects
          </h2>

          <div className="grid gap-8">
            {/* Text Shimmer */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Text Shimmer</h3>
              <div className="space-y-4">
                <TextShimmer className="text-3xl font-bold" duration={2}>
                  Shimmering Text Effect
                </TextShimmer>
                <TextShimmer className="text-xl font-medium" duration={3} spread={3}>
                  Slower shimmer with more spread
                </TextShimmer>
              </div>
            </div>

            {/* Text Effect */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Text Effect (Multiple Presets)</h3>
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Blur preset (per word)</p>
                  <TextEffect
                    key={`blur-${textEffectKey}`}
                    preset="blur"
                    per="word"
                    className="text-2xl font-bold"
                  >
                    Words blur into view
                  </TextEffect>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Fade-in-blur preset (per char)</p>
                  <TextEffect
                    key={`fade-blur-${textEffectKey}`}
                    preset="fade-in-blur"
                    per="char"
                    className="text-2xl font-bold"
                  >
                    Character by character
                  </TextEffect>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Scale preset</p>
                  <TextEffect
                    key={`scale-${textEffectKey}`}
                    preset="scale"
                    per="word"
                    className="text-2xl font-bold"
                  >
                    Scaling animation effect
                  </TextEffect>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Slide preset</p>
                  <TextEffect
                    key={`slide-${textEffectKey}`}
                    preset="slide"
                    per="word"
                    className="text-2xl font-bold"
                  >
                    Sliding into position
                  </TextEffect>
                </div>
                <button
                  onClick={() => setTextEffectKey((k) => k + 1)}
                  className="px-4 py-2 text-sm rounded-md bg-muted hover:bg-muted/80 transition-colors"
                >
                  Replay All Animations
                </button>
              </div>
            </div>

            {/* Spinning Text */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Spinning Text</h3>
              <div className="flex items-center justify-center gap-12 py-8">
                <div className="relative w-32 h-32">
                  <SpinningText
                    radius={5}
                    fontSize={0.9}
                    duration={8}
                    className="font-medium"
                  >
                    MOTION • PRIMITIVES • REACT •
                  </SpinningText>
                </div>
                <div className="relative w-32 h-32">
                  <SpinningText
                    radius={4}
                    fontSize={0.8}
                    duration={6}
                    reverse
                    className="font-bold text-blue-500"
                  >
                    ANIMATIONS • EFFECTS •
                  </SpinningText>
                </div>
              </div>
            </div>

            {/* Text Loop */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Text Loop (Cycling Text)</h3>
              <div className="text-2xl font-bold flex items-center gap-2">
                <span>We build</span>
                <TextLoop className="text-blue-500" interval={2}>
                  <span>websites</span>
                  <span>applications</span>
                  <span>experiences</span>
                  <span>solutions</span>
                </TextLoop>
              </div>
            </div>

            {/* Text Morph */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Text Morph (Letter Animation)</h3>
              <TextMorphDemo />
            </div>

            {/* Text Roll */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Text Roll (3D Flip)</h3>
              <TextRollDemo />
            </div>

            {/* Text Scramble */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Text Scramble (Decode Effect)</h3>
              <TextScrambleDemo />
            </div>

            {/* Text Shimmer Wave */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Text Shimmer Wave (3D Wave)</h3>
              <div className="space-y-4">
                <TextShimmerWave className="text-3xl font-bold" duration={1.5}>
                  Wave Animation
                </TextShimmerWave>
                <TextShimmerWave className="text-xl font-medium" duration={2} spread={2}>
                  Slower with more spread
                </TextShimmerWave>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: Interactive Elements */}
        <section>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Interactive Elements
          </h2>

          <div className="grid gap-8">
            {/* Border Trail */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Border Trail</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="relative p-6 rounded-xl border border-border bg-card overflow-hidden">
                  <BorderTrail
                    size={80}
                    className="bg-gradient-to-r from-blue-500 to-purple-500"
                    transition={{ duration: 4, ease: "linear", repeat: Infinity }}
                  />
                  <p className="text-center text-sm">Default trail</p>
                </div>
                <div className="relative p-6 rounded-xl border border-border bg-card overflow-hidden">
                  <BorderTrail
                    size={60}
                    className="bg-gradient-to-r from-green-400 to-cyan-500"
                    transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                  />
                  <p className="text-center text-sm">Faster trail</p>
                </div>
                <div className="relative p-6 rounded-xl border border-border bg-card overflow-hidden">
                  <BorderTrail
                    size={100}
                    className="bg-gradient-to-r from-orange-500 to-red-500"
                    transition={{ duration: 6, ease: "linear", repeat: Infinity }}
                  />
                  <p className="text-center text-sm">Larger trail</p>
                </div>
              </div>
            </div>

            {/* Animated Group */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Animated Group</h3>
              <AnimatedGroup
                className="flex flex-wrap gap-4"
                preset="blur"
              >
                {[1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={item}
                    className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold"
                  >
                    {item}
                  </div>
                ))}
              </AnimatedGroup>
              <p className="text-xs text-muted-foreground mt-4">
                Items animate in with staggered blur effect
              </p>
            </div>

            {/* In View */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">In View (Scroll-triggered)</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Scroll down to see elements animate when they enter viewport
              </p>
              <div className="space-y-4 max-h-64 overflow-y-auto p-4 border border-border rounded-lg">
                <div className="h-32" />
                <InView
                  variants={{
                    hidden: { opacity: 0, y: 50, filter: "blur(4px)" },
                    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
                    <p className="font-medium">First animated element</p>
                    <p className="text-sm text-muted-foreground">Appears when scrolled into view</p>
                  </div>
                </InView>
                <div className="h-16" />
                <InView
                  variants={{
                    hidden: { opacity: 0, x: -50 },
                    visible: { opacity: 1, x: 0 },
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/20 to-cyan-500/20 border border-green-500/30">
                    <p className="font-medium">Second animated element</p>
                    <p className="text-sm text-muted-foreground">Slides in from the left</p>
                  </div>
                </InView>
                <div className="h-16" />
                <InView
                  variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: { opacity: 1, scale: 1 },
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="p-4 rounded-lg bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
                    <p className="font-medium">Third animated element</p>
                    <p className="text-sm text-muted-foreground">Scales up when visible</p>
                  </div>
                </InView>
                <div className="h-32" />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: Core Components */}
        <section>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Core Components
          </h2>

          <div className="grid gap-8">
            {/* Accordion */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Accordion</h3>
              <Accordion className="space-y-2">
                <AccordionItem value="item-1" className="border border-border rounded-lg">
                  <AccordionTrigger className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-muted/50 rounded-t-lg">
                    <span className="font-medium">What is Motion-Primitives?</span>
                    <span className="text-muted-foreground group-data-[expanded]:rotate-180 transition-transform">▼</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-3">
                    <p className="text-sm text-muted-foreground">
                      Motion-Primitives is a collection of animated React components built with Framer Motion (motion).
                      It provides beautiful, production-ready animation primitives for your applications.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border border-border rounded-lg">
                  <AccordionTrigger className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-muted/50 rounded-t-lg">
                    <span className="font-medium">How do I install components?</span>
                    <span className="text-muted-foreground group-data-[expanded]:rotate-180 transition-transform">▼</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-3">
                    <p className="text-sm text-muted-foreground">
                      Use the CLI command: <code className="bg-muted px-1 rounded">npx motion-primitives@latest add [component]</code>
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Carousel */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Carousel</h3>
              <Carousel className="w-full max-w-md mx-auto">
                <CarouselContent>
                  {[1, 2, 3, 4].map((item) => (
                    <CarouselItem key={item} className="p-1">
                      <div className="h-40 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <span className="text-4xl font-bold text-white">{item}</span>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselNavigation alwaysShow />
                <CarouselIndicator className="mt-4" />
              </Carousel>
            </div>

            {/* Disclosure */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Disclosure (Collapsible)</h3>
              <DisclosureDemo />
            </div>

            {/* Animated Background */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Animated Background</h3>
              <div className="flex gap-2">
                <AnimatedBackground
                  className="rounded-lg bg-zinc-100 dark:bg-zinc-800"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                  enableHover
                >
                  {["Home", "About", "Services", "Contact"].map((tab) => (
                    <button
                      key={tab}
                      data-id={tab}
                      className="px-4 py-2 text-sm font-medium relative z-10 data-[checked=true]:text-white transition-colors"
                    >
                      {tab}
                    </button>
                  ))}
                </AnimatedBackground>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Hover over the tabs to see the background follow</p>
            </div>
          </div>
        </section>

        {/* SECTION: Navigation & Controls */}
        <section>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Navigation & Controls
          </h2>

          <div className="grid gap-8">
            {/* Transition Panel */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-medium mb-4">Transition Panel</h3>
              <div className="flex gap-2 mb-4">
                {panels.map((panel, index) => (
                  <button
                    key={index}
                    onClick={() => setActivePanel(index)}
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${
                      activePanel === index
                        ? "bg-foreground text-background"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {panel.title}
                  </button>
                ))}
              </div>
              <TransitionPanel
                activeIndex={activePanel}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                variants={{
                  enter: { opacity: 0, y: 20, filter: "blur(4px)" },
                  center: { opacity: 1, y: 0, filter: "blur(0px)" },
                  exit: { opacity: 0, y: -20, filter: "blur(4px)" },
                }}
              >
                {panels.map((panel, index) => (
                  <div key={index} className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">{panel.title}</h4>
                    <p className="text-sm text-muted-foreground">{panel.content}</p>
                  </div>
                ))}
              </TransitionPanel>
            </div>
          </div>
        </section>

        {/* SECTION: All Components Reference */}
        <section>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-500" />
            All Components ({Object.values(MOTION_PRIMITIVES_COMPONENTS).flat().length} total)
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(MOTION_PRIMITIVES_COMPONENTS).map(([category, components]) => (
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
                          text={`npx motion-primitives@latest add ${comp.slug}`}
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
            <span>Motion-Primitives Component Showcase</span>
            <a
              href="https://github.com/ibelick/motion-primitives"
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
