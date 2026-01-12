"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft, Check, Bell, AlertCircle, Info, Terminal, Mail, User,
  CreditCard, Settings, Search, ChevronRight, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, Calendar as CalendarIcon, Plus,
  Trash2, Edit, MoreHorizontal, Copy, Share, Download, LogOut, UserPlus,
  Moon, Sun, Laptop, Home, FileText, Image, Video, Music, Archive,
  ChevronDown, ChevronsUpDown, X, Loader2
} from "lucide-react";

// ===== ALL UI COMPONENTS =====
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from "@/components/ui/command";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent } from "@/components/ui/context-menu";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuGroup, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator, MenubarSub, MenubarSubTrigger, MenubarSubContent } from "@/components/ui/menubar";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, RadialBarChart, RadialBar, CartesianGrid, XAxis, YAxis, Legend } from "recharts";

// ===== DUMMY DATA =====
const tableData = [
  { id: 1, name: "John Doe", email: "john@example.com", status: "Active", amount: "$1,250.00" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", status: "Pending", amount: "$890.00" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", status: "Inactive", amount: "$2,100.00" },
  { id: 4, name: "Alice Brown", email: "alice@example.com", status: "Active", amount: "$450.00" },
];

const scrollItems = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`);

// Chart Data
const barChartData = [
  { month: "Jan", desktop: 186, mobile: 80 },
  { month: "Feb", desktop: 305, mobile: 200 },
  { month: "Mar", desktop: 237, mobile: 120 },
  { month: "Apr", desktop: 273, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "Jun", desktop: 214, mobile: 140 },
];

const lineChartData = [
  { month: "Jan", visitors: 2400 },
  { month: "Feb", visitors: 1398 },
  { month: "Mar", visitors: 9800 },
  { month: "Apr", visitors: 3908 },
  { month: "May", visitors: 4800 },
  { month: "Jun", visitors: 3800 },
];

const areaChartData = [
  { month: "Jan", revenue: 4000, expenses: 2400 },
  { month: "Feb", revenue: 3000, expenses: 1398 },
  { month: "Mar", revenue: 2000, expenses: 9800 },
  { month: "Apr", revenue: 2780, expenses: 3908 },
  { month: "May", revenue: 1890, expenses: 4800 },
  { month: "Jun", revenue: 2390, expenses: 3800 },
];

const pieChartData = [
  { name: "Chrome", value: 400, fill: "hsl(var(--chart-1))" },
  { name: "Safari", value: 300, fill: "hsl(var(--chart-2))" },
  { name: "Firefox", value: 200, fill: "hsl(var(--chart-3))" },
  { name: "Edge", value: 100, fill: "hsl(var(--chart-4))" },
];

const radialChartData = [
  { name: "Progress", value: 72, fill: "hsl(var(--chart-1))" },
];

// ===== FORM SCHEMA =====
const profileFormSchema = z.object({
  username: z.string().min(2, { message: "Username must be at least 2 characters." }).max(30),
  email: z.string().email({ message: "Please enter a valid email address." }),
  bio: z.string().max(160).optional(),
  role: z.string({ required_error: "Please select a role." }),
  notifications: z.boolean().default(false).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// ===== FORM DEMO COMPONENT =====
function FormDemo() {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      email: "",
      bio: "",
      notifications: true,
    },
  });

  function onSubmit(data: ProfileFormValues) {
    toast("Form submitted!", {
      description: (
        <pre className="mt-2 w-full rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>React Hook Form Integration</CardTitle>
        <CardDescription>Form with Zod validation and error handling</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is your public display name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose your account role.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tell us a little bit about yourself" {...field} />
                  </FormControl>
                  <FormDescription>
                    Maximum 160 characters.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notifications"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Email Notifications</FormLabel>
                    <FormDescription>
                      Receive emails about your account activity.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button type="submit">Submit</Button>
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Reset
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ===== NAVIGATION MENU DEMO COMPONENT =====
function NavigationMenuDemo() {
  const components = [
    {
      title: "Alert Dialog",
      href: "#overlays",
      description: "A modal dialog that interrupts the user with important content.",
    },
    {
      title: "Hover Card",
      href: "#cards",
      description: "For sighted users to preview content on hover.",
    },
    {
      title: "Progress",
      href: "#feedback",
      description: "Displays an indicator showing completion progress.",
    },
    {
      title: "Scroll Area",
      href: "#layout",
      description: "Visually or semantically separates content.",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Navigation Menu</CardTitle>
        <CardDescription>Dropdown mega menu with descriptions</CardDescription>
      </CardHeader>
      <CardContent>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                  <li className="row-span-3">
                    <NavigationMenuLink asChild>
                      <a
                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                        href="/"
                      >
                        <div className="mb-2 mt-4 text-lg font-medium">
                          shadcn/ui
                        </div>
                        <p className="text-sm leading-tight text-muted-foreground">
                          Beautifully designed components built with Radix UI and Tailwind CSS.
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <a
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        href="#buttons"
                      >
                        <div className="text-sm font-medium leading-none">Introduction</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Re-usable components built using Radix UI and Tailwind CSS.
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <a
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        href="#forms"
                      >
                        <div className="text-sm font-medium leading-none">Installation</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          How to install dependencies and structure your app.
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Components</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {components.map((component) => (
                    <li key={component.title}>
                      <NavigationMenuLink asChild>
                        <a
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          href={component.href}
                        >
                          <div className="text-sm font-medium leading-none">{component.title}</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            {component.description}
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="#layout" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Documentation
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </CardContent>
    </Card>
  );
}

export default function ExamplesPage() {
  const [sliderValue, setSliderValue] = useState([50]);
  const [switchOn, setSwitchOn] = useState(true);
  const [checkboxChecked, setCheckboxChecked] = useState(true);
  const [progress, setProgress] = useState(66);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [radioValue, setRadioValue] = useState("option-1");

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border sticky top-0 bg-background z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
            <Link href="/private/gs-site" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-medium text-foreground tracking-tight">
                shadcn/ui Component Library
              </h1>
              <p className="text-xs text-muted-foreground tracking-wide uppercase">
                45 Components • Full Interactive Demo
              </p>
            </div>
            <Badge variant="outline">v2.0</Badge>
          </div>
        </header>

        {/* Navigation */}
        <nav className="border-b border-border bg-card sticky top-[73px] z-40">
          <div className="max-w-7xl mx-auto px-6">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-6 py-3">
                {["Buttons", "Cards", "Forms", "Data", "Charts", "Navigation", "Overlays", "Feedback", "Layout"].map((section) => (
                  <a key={section} href={`#${section.toLowerCase()}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {section}
                  </a>
                ))}
              </div>
            </ScrollArea>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-16">

          {/* ============================================ */}
          {/* BUTTONS & ACTIONS */}
          {/* ============================================ */}
          <section id="buttons">
            <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
              <span className="w-2 h-2 bg-primary"></span>
              Buttons & Actions
            </h2>
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Button Variants</CardTitle>
                  <CardDescription>All available button styles and sizes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <Button variant="default">Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="link">Link</Button>
                  </div>
                  <Separator />
                  <div className="flex flex-wrap gap-3 items-center">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon"><Settings className="w-4 h-4" /></Button>
                  </div>
                  <Separator />
                  <div className="flex flex-wrap gap-3">
                    <Button disabled>Disabled</Button>
                    <Button className="gap-2"><Mail className="w-4 h-4" /> With Icon</Button>
                    <Button className="gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Toggle & Toggle Group</CardTitle>
                  <CardDescription>Toggleable buttons for formatting and options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Toggle aria-label="Toggle bold"><Bold className="h-4 w-4" /></Toggle>
                    <Toggle aria-label="Toggle italic"><Italic className="h-4 w-4" /></Toggle>
                    <Toggle aria-label="Toggle underline"><Underline className="h-4 w-4" /></Toggle>
                  </div>
                  <Separator />
                  <div>
                    <Label className="mb-2 block">Alignment (Single Select)</Label>
                    <ToggleGroup type="single" defaultValue="left">
                      <ToggleGroupItem value="left"><AlignLeft className="h-4 w-4" /></ToggleGroupItem>
                      <ToggleGroupItem value="center"><AlignCenter className="h-4 w-4" /></ToggleGroupItem>
                      <ToggleGroupItem value="right"><AlignRight className="h-4 w-4" /></ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  <div>
                    <Label className="mb-2 block">Formatting (Multiple Select)</Label>
                    <ToggleGroup type="multiple">
                      <ToggleGroupItem value="bold"><Bold className="h-4 w-4" /></ToggleGroupItem>
                      <ToggleGroupItem value="italic"><Italic className="h-4 w-4" /></ToggleGroupItem>
                      <ToggleGroupItem value="underline"><Underline className="h-4 w-4" /></ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ============================================ */}
          {/* CARDS & CONTAINERS */}
          {/* ============================================ */}
          <section id="cards">
            <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
              <span className="w-2 h-2 bg-primary"></span>
              Cards & Containers
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Card</CardTitle>
                  <CardDescription>With header and footer</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Card content goes here.</p>
                </CardContent>
                <CardFooter>
                  <Button size="sm">Action</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$45,231</div>
                  <p className="text-sm text-muted-foreground">+20.1% from last month</p>
                  <Progress value={75} className="mt-4" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>3 unread</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {["New comment", "User signed up", "Payment received"].map((msg, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Bell className="w-4 h-4 text-muted-foreground" />
                      <span>{msg}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Hover Card</CardTitle>
                <CardDescription>Shows profile info on hover</CardDescription>
              </CardHeader>
              <CardContent>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button variant="link" className="p-0 h-auto">@shadcn</Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="flex gap-4">
                      <Avatar><AvatarFallback>SC</AvatarFallback></Avatar>
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold">@shadcn</h4>
                        <p className="text-sm text-muted-foreground">Creator of shadcn/ui</p>
                        <div className="flex items-center pt-2">
                          <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                          <span className="text-xs text-muted-foreground">Joined December 2021</span>
                        </div>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Carousel</CardTitle>
                <CardDescription>Slideable content</CardDescription>
              </CardHeader>
              <CardContent>
                <Carousel className="w-full max-w-sm mx-auto">
                  <CarouselContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <CarouselItem key={n}>
                        <Card>
                          <CardContent className="flex aspect-square items-center justify-center p-6">
                            <span className="text-4xl font-semibold">{n}</span>
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </CardContent>
            </Card>
          </section>

          {/* ============================================ */}
          {/* FORMS & INPUTS */}
          {/* ============================================ */}
          <section id="forms">
            <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
              <span className="w-2 h-2 bg-primary"></span>
              Forms & Inputs
            </h2>
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Text Inputs</CardTitle>
                </CardHeader>

          {/* ============================================ */}
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="Enter email" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" placeholder="Enter password" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio (Textarea)</Label>
                    <Textarea id="bio" placeholder="Tell us about yourself" rows={3} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Select & Dropdowns</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Basic Select</Label>
                      <Select>
                        <SelectTrigger><SelectValue placeholder="Select fruit" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apple">Apple</SelectItem>
                          <SelectItem value="banana">Banana</SelectItem>
                          <SelectItem value="orange">Orange</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Grouped Select</Label>
                      <Select>
                        <SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>North America</SelectLabel>
                            <SelectItem value="pst">Pacific</SelectItem>
                            <SelectItem value="est">Eastern</SelectItem>
                          </SelectGroup>
                          <SelectGroup>
                            <SelectLabel>Europe</SelectLabel>
                            <SelectItem value="gmt">GMT</SelectItem>
                            <SelectItem value="cet">CET</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Checkbox, Radio & Switch</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label>Checkboxes</Label>
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-2">
                        <Checkbox id="terms" checked={checkboxChecked} onCheckedChange={(c) => setCheckboxChecked(!!c)} />
                        <Label htmlFor="terms">Accept terms</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="marketing" />
                        <Label htmlFor="marketing">Marketing emails</Label>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <Label>Radio Group</Label>
                    <RadioGroup value={radioValue} onValueChange={setRadioValue}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="option-1" id="option-1" />
                        <Label htmlFor="option-1">Default</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="option-2" id="option-2" />
                        <Label htmlFor="option-2">Comfortable</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="option-3" id="option-3" />
                        <Label htmlFor="option-3">Compact</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <Label>Switches</Label>
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-2">
                        <Switch checked={switchOn} onCheckedChange={setSwitchOn} />
                        <Label>Notifications {switchOn ? "On" : "Off"}</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch /><Label>Dark mode</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Slider</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <Label>Volume</Label>
                    <span className="text-sm text-muted-foreground">{sliderValue[0]}%</span>
                  </div>
                  <Slider value={sliderValue} onValueChange={setSliderValue} max={100} step={1} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>OTP Input</CardTitle>
                  <CardDescription>One-time password entry</CardDescription>
                </CardHeader>
                <CardContent>
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  {otp && <p className="mt-2 text-sm text-muted-foreground">Entered: {otp}</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Calendar & Date Picker</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-6">
                  <Calendar mode="single" selected={date} onSelect={setDate} className="border" />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Selected</Label>
                      <p className="text-sm">{date ? date.toDateString() : "None"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Date Picker (Popover)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-[220px] justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? date.toDateString() : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={date} onSelect={setDate} />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <FormDemo />
            </div>
          </section>

          {/* ============================================ */}
          {/* DATA DISPLAY */}
          {/* ============================================ */}
          <section id="data">
            <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
              <span className="w-2 h-2 bg-primary"></span>
              Data Display
            </h2>
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Table</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell>{row.email}</TableCell>
                          <TableCell>
                            <Badge variant={row.status === "Active" ? "default" : row.status === "Pending" ? "secondary" : "outline"}>
                              {row.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{row.amount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle>Badges</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      <Badge>Default</Badge>
                      <Badge variant="secondary">Secondary</Badge>
                      <Badge variant="outline">Outline</Badge>
                      <Badge variant="destructive">Destructive</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Avatars</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Avatar><AvatarFallback>GS</AvatarFallback></Avatar>
                      <Avatar><AvatarFallback>AM</AvatarFallback></Avatar>
                      <Avatar><AvatarFallback>SK</AvatarFallback></Avatar>
                      <Avatar><AvatarImage src="https://github.com/shadcn.png" /><AvatarFallback>CN</AvatarFallback></Avatar>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle>Skeleton Loading</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ============================================ */}
          {/* CHARTS & VISUALIZATIONS */}
          {/* ============================================ */}
          <section id="charts">
            <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
              <span className="w-2 h-2 bg-primary"></span>
              Charts & Visualizations
            </h2>
            <div className="grid gap-6">
              {/* Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Bar Chart</CardTitle>
                  <CardDescription>Monthly revenue comparison (desktop vs mobile)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      desktop: {
                        label: "Desktop",
                        color: "hsl(var(--chart-1))",
                      },
                      mobile: {
                        label: "Mobile",
                        color: "hsl(var(--chart-2))",
                      },
                    }}
                    className="h-[300px] w-full"
                  >
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="desktop" fill="var(--color-desktop)" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="mobile" fill="var(--color-mobile)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Line Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Line Chart</CardTitle>
                  <CardDescription>Visitor analytics trend over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      visitors: {
                        label: "Visitors",
                        color: "hsl(var(--chart-3))",
                      },
                    }}
                    className="h-[300px] w-full"
                  >
                    <LineChart data={lineChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line
                        type="monotone"
                        dataKey="visitors"
                        stroke="var(--color-visitors)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Area Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Area Chart</CardTitle>
                  <CardDescription>Stacked area for cumulative financial data</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      revenue: {
                        label: "Revenue",
                        color: "hsl(var(--chart-4))",
                      },
                      expenses: {
                        label: "Expenses",
                        color: "hsl(var(--chart-5))",
                      },
                    }}
                    className="h-[300px] w-full"
                  >
                    <AreaChart data={areaChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stackId="1"
                        stroke="var(--color-revenue)"
                        fill="var(--color-revenue)"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stackId="1"
                        stroke="var(--color-expenses)"
                        fill="var(--color-expenses)"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pie Chart</CardTitle>
                    <CardDescription>Browser market share distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        chrome: {
                          label: "Chrome",
                          color: "hsl(var(--chart-1))",
                        },
                        safari: {
                          label: "Safari",
                          color: "hsl(var(--chart-2))",
                        },
                        firefox: {
                          label: "Firefox",
                          color: "hsl(var(--chart-3))",
                        },
                        edge: {
                          label: "Edge",
                          color: "hsl(var(--chart-4))",
                        },
                      }}
                      className="h-[300px] w-full"
                    >
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent />} />
                      </PieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Radial Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Radial Chart</CardTitle>
                    <CardDescription>Goal progress percentage visualization</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        progress: {
                          label: "Progress",
                          color: "hsl(var(--chart-1))",
                        },
                      }}
                      className="h-[300px] w-full"
                    >
                      <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="80%"
                        barSize={20}
                        data={radialChartData}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <RadialBar
                          dataKey="value"
                          fill="var(--color-progress)"
                          cornerRadius={10}
                          background={{ fill: "hsl(var(--muted))" }}
                        />
                        <text
                          x="50%"
                          y="50%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-foreground text-3xl font-bold"
                        >
                          {radialChartData[0].value}%
                        </text>
                      </RadialBarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* ============================================ */}
          {/* NAVIGATION */}
          {/* ============================================ */}
          <section id="navigation">
            <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
              <span className="w-2 h-2 bg-primary"></span>
              Navigation
            </h2>
            <div className="grid gap-6">
              <Card>
                <CardHeader><CardTitle>Breadcrumb</CardTitle></CardHeader>
                <CardContent>
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem><BreadcrumbLink href="/examples">Examples</BreadcrumbLink></BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem><BreadcrumbPage>Navigation</BreadcrumbPage></BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Tabs</CardTitle></CardHeader>
                <CardContent>
                  <Tabs defaultValue="account">
                    <TabsList>
                      <TabsTrigger value="account">Account</TabsTrigger>
                      <TabsTrigger value="password">Password</TabsTrigger>
                      <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>
                    <TabsContent value="account" className="mt-4">
                      <p className="text-sm text-muted-foreground">Manage your account settings here.</p>
                    </TabsContent>
                    <TabsContent value="password" className="mt-4">
                      <p className="text-sm text-muted-foreground">Change your password and security.</p>
                    </TabsContent>
                    <TabsContent value="settings" className="mt-4">
                      <p className="text-sm text-muted-foreground">Configure general settings.</p>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Menubar</CardTitle>
                  <CardDescription>Application menu</CardDescription>
                </CardHeader>
                <CardContent>
                  <Menubar>
                    <MenubarMenu>
                      <MenubarTrigger>File</MenubarTrigger>
                      <MenubarContent>
                        <MenubarItem>New Tab</MenubarItem>
                        <MenubarItem>New Window</MenubarItem>
                        <MenubarSeparator />
                        <MenubarSub>
                          <MenubarSubTrigger>Share</MenubarSubTrigger>
                          <MenubarSubContent>
                            <MenubarItem>Email</MenubarItem>
                            <MenubarItem>Messages</MenubarItem>
                          </MenubarSubContent>
                        </MenubarSub>
                      </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                      <MenubarTrigger>Edit</MenubarTrigger>
                      <MenubarContent>
                        <MenubarItem>Undo</MenubarItem>
                        <MenubarItem>Redo</MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem>Cut</MenubarItem>
                        <MenubarItem>Copy</MenubarItem>
                        <MenubarItem>Paste</MenubarItem>
                      </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                      <MenubarTrigger>View</MenubarTrigger>
                      <MenubarContent>
                        <MenubarItem>Zoom In</MenubarItem>
                        <MenubarItem>Zoom Out</MenubarItem>
                      </MenubarContent>
                    </MenubarMenu>
                  </Menubar>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Pagination</CardTitle></CardHeader>
                <CardContent>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
                      <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
                      <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
                      <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
                      <PaginationItem><PaginationEllipsis /></PaginationItem>
                      <PaginationItem><PaginationNext href="#" /></PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </CardContent>
              </Card>

              <NavigationMenuDemo />
            </div>
          </section>

          {/* ============================================ */}
          {/* OVERLAYS & MODALS */}
          {/* ============================================ */}
          <section id="overlays">
            <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
              <span className="w-2 h-2 bg-primary"></span>
              Overlays & Modals
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader><CardTitle>Dialog</CardTitle></CardHeader>
                <CardContent>
                  <Dialog>
                    <DialogTrigger asChild><Button>Open Dialog</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Dialog Title</DialogTitle>
                        <DialogDescription>This is a dialog description.</DialogDescription>
                      </DialogHeader>
                      <div className="py-4"><p className="text-sm">Dialog content goes here.</p></div>
                      <DialogFooter>
                        <Button variant="outline">Cancel</Button>
                        <Button>Save</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Alert Dialog</CardTitle></CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="destructive">Delete Item</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction>Continue</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Sheet</CardTitle></CardHeader>
                <CardContent>
                  <Sheet>
                    <SheetTrigger asChild><Button variant="outline">Open Sheet</Button></SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Sheet Title</SheetTitle>
                        <SheetDescription>Sheet description here.</SheetDescription>
                      </SheetHeader>
                      <div className="py-4"><p className="text-sm">Sheet content.</p></div>
                      <SheetFooter><SheetClose asChild><Button>Close</Button></SheetClose></SheetFooter>
                    </SheetContent>
                  </Sheet>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Drawer</CardTitle></CardHeader>
                <CardContent>
                  <Drawer>
                    <DrawerTrigger asChild><Button variant="outline">Open Drawer</Button></DrawerTrigger>
                    <DrawerContent>
                      <DrawerHeader>
                        <DrawerTitle>Drawer Title</DrawerTitle>
                        <DrawerDescription>Bottom drawer content.</DrawerDescription>
                      </DrawerHeader>
                      <div className="p-4"><p className="text-sm">Drawer content here.</p></div>
                      <DrawerFooter>
                        <Button>Submit</Button>
                        <DrawerClose asChild><Button variant="outline">Cancel</Button></DrawerClose>
                      </DrawerFooter>
                    </DrawerContent>
                  </Drawer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Popover</CardTitle></CardHeader>
                <CardContent>
                  <Popover>
                    <PopoverTrigger asChild><Button variant="outline">Open Popover</Button></PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium">Dimensions</h4>
                        <p className="text-sm text-muted-foreground">Set the dimensions for the layer.</p>
                      </div>
                      <div className="grid gap-2 mt-4">
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label>Width</Label>
                          <Input className="col-span-2 h-8" defaultValue="100%" />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Dropdown Menu</CardTitle></CardHeader>
                <CardContent>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">Open Menu <ChevronDown className="ml-2 h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem><User className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
                        <DropdownMenuItem><CreditCard className="mr-2 h-4 w-4" /> Billing</DropdownMenuItem>
                        <DropdownMenuItem><Settings className="mr-2 h-4 w-4" /> Settings</DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger><UserPlus className="mr-2 h-4 w-4" /> Invite</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem><Mail className="mr-2 h-4 w-4" /> Email</DropdownMenuItem>
                          <DropdownMenuItem><Share className="mr-2 h-4 w-4" /> Share</DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem><LogOut className="mr-2 h-4 w-4" /> Log out</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Tooltip</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Tooltip>
                      <TooltipTrigger asChild><Button variant="outline">Hover me</Button></TooltipTrigger>
                      <TooltipContent><p>This is a tooltip</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild><Button variant="outline" size="icon"><Info className="w-4 h-4" /></Button></TooltipTrigger>
                      <TooltipContent><p>More information</p></TooltipContent>
                    </Tooltip>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Context Menu</CardTitle>
                  <CardDescription>Right-click the box</CardDescription>
                </CardHeader>
                <CardContent>
                  <ContextMenu>
                    <ContextMenuTrigger className="flex h-24 w-full items-center justify-center border border-dashed text-sm text-muted-foreground">
                      Right click here
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem><Copy className="mr-2 h-4 w-4" /> Copy</ContextMenuItem>
                      <ContextMenuItem><Edit className="mr-2 h-4 w-4" /> Edit</ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuSub>
                        <ContextMenuSubTrigger>More</ContextMenuSubTrigger>
                        <ContextMenuSubContent>
                          <ContextMenuItem><Download className="mr-2 h-4 w-4" /> Download</ContextMenuItem>
                          <ContextMenuItem><Share className="mr-2 h-4 w-4" /> Share</ContextMenuItem>
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                      <ContextMenuSeparator />
                      <ContextMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </CardContent>
              </Card>

              <Card className="md:col-span-2 lg:col-span-1">
                <CardHeader>
                  <CardTitle>Command Palette</CardTitle>
                  <CardDescription>Searchable command menu</CardDescription>
                </CardHeader>
                <CardContent>
                  <Command className="border">
                    <CommandInput placeholder="Type a command..." />
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup heading="Suggestions">
                        <CommandItem><CalendarIcon className="mr-2 h-4 w-4" /> Calendar</CommandItem>
                        <CommandItem><Search className="mr-2 h-4 w-4" /> Search</CommandItem>
                        <CommandItem><Settings className="mr-2 h-4 w-4" /> Settings</CommandItem>
                      </CommandGroup>
                      <CommandSeparator />
                      <CommandGroup heading="Settings">
                        <CommandItem><User className="mr-2 h-4 w-4" /> Profile</CommandItem>
                        <CommandItem><CreditCard className="mr-2 h-4 w-4" /> Billing</CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ============================================ */}
          {/* FEEDBACK */}
          {/* ============================================ */}
          <section id="feedback">
            <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
              <span className="w-2 h-2 bg-primary"></span>
              Feedback
            </h2>
            <div className="grid gap-6">
              <Card>
                <CardHeader><CardTitle>Alerts</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Heads up!</AlertTitle>
                    <AlertDescription>You can add components using the CLI.</AlertDescription>
                  </Alert>
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Your session has expired.</AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Progress</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Upload progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setProgress(Math.max(0, progress - 10))}>-10%</Button>
                    <Button size="sm" variant="outline" onClick={() => setProgress(Math.min(100, progress + 10))}>+10%</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Spinner</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Spinner className="h-4 w-4" />
                    <Spinner className="h-6 w-6" />
                    <Spinner className="h-8 w-8" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Toast Notifications (Sonner)</CardTitle>
                  <CardDescription>Click buttons to trigger different toast types</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Basic Toasts</Label>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        onClick={() => toast("Event has been created")}
                      >
                        Default
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => toast.success("Successfully saved!")}
                      >
                        Success
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => toast.error("Error occurred")}
                      >
                        Error
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => toast.warning("Warning: Check your settings")}
                      >
                        Warning
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => toast.info("New feature available")}
                      >
                        Info
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Advanced Toasts</Label>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        onClick={() => toast("Event created", {
                          description: "Monday, January 3rd at 6:00pm",
                          action: {
                            label: "Undo",
                            onClick: () => toast("Undo action triggered")
                          }
                        })}
                      >
                        With Action
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => toast.promise(
                          new Promise((resolve) => setTimeout(resolve, 2000)),
                          {
                            loading: "Loading...",
                            success: "Data loaded successfully",
                            error: "Failed to load data"
                          }
                        )}
                      >
                        Promise
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => toast("Rich content toast", {
                          description: "This toast includes a description with more details about the notification."
                        })}
                      >
                        With Description
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ============================================ */}
          {/* LAYOUT */}
          {/* ============================================ */}
          <section id="layout">
            <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
              <span className="w-2 h-2 bg-primary"></span>
              Layout & Structure
            </h2>
            <div className="grid gap-6">
              <Card>
                <CardHeader><CardTitle>Accordion</CardTitle></CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>Is it accessible?</AccordionTrigger>
                      <AccordionContent>Yes. It adheres to WAI-ARIA design pattern.</AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>Is it styled?</AccordionTrigger>
                      <AccordionContent>Yes. It comes with default styles matching your theme.</AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger>Is it animated?</AccordionTrigger>
                      <AccordionContent>Yes. It's animated by default.</AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Collapsible</CardTitle></CardHeader>
                <CardContent>
                  <Collapsible open={isCollapsibleOpen} onOpenChange={setIsCollapsibleOpen} className="w-full space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">@shadcn starred 3 repositories</h4>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm"><ChevronsUpDown className="h-4 w-4" /></Button>
                      </CollapsibleTrigger>
                    </div>
                    <div className="border px-4 py-2 text-sm">@radix-ui/primitives</div>
                    <CollapsibleContent className="space-y-2">
                      <div className="border px-4 py-2 text-sm">@radix-ui/colors</div>
                      <div className="border px-4 py-2 text-sm">@stitches/react</div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Scroll Area</CardTitle></CardHeader>
                <CardContent>
                  <ScrollArea className="h-48 w-full border p-4">
                    <div className="space-y-2">
                      {scrollItems.slice(0, 20).map((item) => (
                        <div key={item} className="text-sm">{item}</div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resizable Panels</CardTitle>
                  <CardDescription>Drag the handle to resize</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResizablePanelGroup direction="horizontal" className="min-h-[200px] border">
                    <ResizablePanel defaultSize={50}>
                      <div className="flex h-full items-center justify-center p-6">
                        <span className="font-semibold">Panel One</span>
                      </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={50}>
                      <div className="flex h-full items-center justify-center p-6">
                        <span className="font-semibold">Panel Two</span>
                      </div>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Separator</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium">shadcn/ui</h4>
                      <p className="text-sm text-muted-foreground">Open-source component library.</p>
                    </div>
                    <Separator />
                    <div className="flex h-5 items-center space-x-4 text-sm">
                      <div>Blog</div>
                      <Separator orientation="vertical" />
                      <div>Docs</div>
                      <Separator orientation="vertical" />
                      <div>Source</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ============================================ */}
          {/* SUMMARY */}
          {/* ============================================ */}
          <section className="border-t border-border pt-8">
            <Card>
              <CardHeader>
                <CardTitle>Installed Components Summary</CardTitle>
                <CardDescription>45 shadcn/ui components ready to use</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Accordion", "Alert", "Alert Dialog", "Avatar", "Badge", "Breadcrumb",
                    "Button", "Calendar", "Card", "Carousel", "Chart", "Checkbox",
                    "Collapsible", "Command", "Context Menu", "Dialog", "Drawer",
                    "Dropdown Menu", "Form", "Hover Card", "Input", "Input OTP", "Label",
                    "Menubar", "Navigation Menu", "Pagination", "Popover", "Progress",
                    "Radio Group", "Resizable", "Scroll Area", "Select", "Separator",
                    "Sheet", "Skeleton", "Slider", "Sonner", "Spinner", "Switch",
                    "Table", "Tabs", "Textarea", "Toggle", "Toggle Group", "Tooltip"
                  ].map((name) => (
                    <Badge key={name} variant="outline">{name}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

        </main>

        {/* Footer */}
        <footer className="border-t border-border mt-12">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <p className="text-xs text-muted-foreground text-center tracking-wide">
              shadcn/ui Component Library • 45 Components • GS Site 2025
            </p>
          </div>
        </footer>

        {/* Toast Notifications */}
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
