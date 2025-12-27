"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, differenceInDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Calculate bi-weekly cycle info
const CYCLE_START_DATE = new Date("2025-01-01");
const CYCLE_LENGTH_DAYS = 14;
const POLL_WINDOW_DAYS = 2; // Show poll for first 2 days of each cycle

function getBiweeklyCycleInfo() {
  const today = new Date();
  const daysSinceStart = differenceInDays(today, CYCLE_START_DATE);
  const cycleNumber = Math.floor(daysSinceStart / CYCLE_LENGTH_DAYS);
  const dayInCycle = daysSinceStart % CYCLE_LENGTH_DAYS;
  const isInPollWindow = dayInCycle < POLL_WINDOW_DAYS;

  return { cycleNumber, dayInCycle, isInPollWindow };
}

interface FormData {
  // Page 1
  entryDate: string;
  entryTime: string[];
  entryTimeOther: string;
  // Page 2
  deepWorkNoon: string;
  deepWork245pm: string;
  deepWork545pm: string;
  deepWorkEod: string;
  whatGotDone: string;
  improveHow: string;
  cleanDesk: boolean;
  cleanDesktop: boolean;
  pdfStatus: string;
  pdfsAdded: string;
  notionCalendarGrade: string;
  mood: string;
  // Bi-weekly poll
  biweeklyPhaseReflection: string;
  biweeklyCycleNumber: number | null;
}

const initialFormData: FormData = {
  entryDate: new Date().toISOString().split("T")[0],
  entryTime: [],
  entryTimeOther: "",
  deepWorkNoon: "",
  deepWork245pm: "",
  deepWork545pm: "",
  deepWorkEod: "",
  whatGotDone: "",
  improveHow: "",
  cleanDesk: false,
  cleanDesktop: false,
  pdfStatus: "",
  pdfsAdded: "",
  notionCalendarGrade: "",
  mood: "",
  biweeklyPhaseReflection: "",
  biweeklyCycleNumber: null,
};

export default function ProductivityForm() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Bi-weekly poll state
  const [showBiweeklyPoll, setShowBiweeklyPoll] = useState(false);
  const [biweeklyInput, setBiweeklyInput] = useState("");
  const [currentCycleNumber, setCurrentCycleNumber] = useState<number | null>(null);

  // Check if bi-weekly poll should show on mount
  useEffect(() => {
    const { cycleNumber, isInPollWindow } = getBiweeklyCycleInfo();
    setCurrentCycleNumber(cycleNumber);

    if (isInPollWindow) {
      // Check localStorage to see if already answered this cycle
      const answeredKey = `biweeklyPoll_cycle_${cycleNumber}`;
      const alreadyAnswered = localStorage.getItem(answeredKey);

      if (!alreadyAnswered) {
        setShowBiweeklyPoll(true);
      }
    }
  }, []);

  const handleBiweeklySubmit = () => {
    if (!biweeklyInput.trim()) return;

    // Save to localStorage so it doesn't show again this cycle
    if (currentCycleNumber !== null) {
      localStorage.setItem(`biweeklyPoll_cycle_${currentCycleNumber}`, "true");
    }

    // Store in form data to be saved with the form submission
    setFormData((prev) => ({
      ...prev,
      biweeklyPhaseReflection: biweeklyInput,
      biweeklyCycleNumber: currentCycleNumber,
    }));

    setShowBiweeklyPoll(false);
  };

  const timeOptions = ["12:45pm", "3:45pm", "6:45pm", "Other"];

  const handleTimeChange = (time: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      entryTime: checked
        ? [...prev.entryTime, time]
        : prev.entryTime.filter((t) => t !== time),
    }));
  };

  const validatePage1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.entryDate) {
      newErrors.entryDate = "Date is required";
    }
    if (formData.entryTime.length === 0) {
      newErrors.entryTime = "Please select at least one time";
    }
    if (formData.entryTime.includes("Other") && !formData.entryTimeOther) {
      newErrors.entryTimeOther = "Please specify the time";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePage2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.notionCalendarGrade) {
      newErrors.notionCalendarGrade = "Notion Calendar Grade is required";
    }
    if (!formData.mood) {
      newErrors.mood = "Mood is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validatePage1()) {
      setPage(2);
    }
  };

  const handleBack = () => {
    setPage(1);
  };

  const handleClearForm = () => {
    setFormData(initialFormData);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validatePage2()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/forms/productivity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      router.push("/new-form/success");
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrors({ submit: "Failed to submit form. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Bi-weekly Phase Reflection Poll */}
      <Dialog open={showBiweeklyPoll} onOpenChange={() => {}}>
        <DialogContent className="bg-white sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-gray-800">Bi-Weekly Phase Reflection</DialogTitle>
            <DialogDescription className="text-gray-600">
              Before you continue, take a moment to reflect on your current phase.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label htmlFor="phase-reflection" className="text-gray-700">
              What kind of phase does the last week & upcoming week feel like?
            </Label>
            <Input
              id="phase-reflection"
              placeholder="e.g., Recovery phase, Sprint mode, Planning week..."
              value={biweeklyInput}
              onChange={(e) => setBiweeklyInput(e.target.value)}
              className="text-gray-900 placeholder:text-gray-400 border-gray-300"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleBiweeklySubmit}
              disabled={!biweeklyInput.trim()}
              className="bg-[#673ab7] text-white hover:bg-[#5e35a1]"
            >
              Continue to Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-[#9a9cc2] py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Header Card */}
          <Card className="bg-white rounded-lg overflow-hidden">
          <div className="h-2 bg-[#673ab7]" />
          <CardContent className="p-6">
            <h1 className="text-2xl font-normal text-gray-800 mb-2">
              Productivity Accountability Form
            </h1>
            <p className="text-sm text-red-600">* Indicates required question</p>
          </CardContent>
        </Card>

        {/* Mission Card */}
        <Card className="bg-white rounded-lg overflow-hidden">
          <CardContent className="p-6">
            <p className="text-gray-700 italic mb-4">
              <strong>Keep the main thing the main thing.</strong>
              <br />
              <em>My Mission: LEOM in theaters 03.01.2030</em>
              <br />
              <em>My mission cost: $$$$</em>
            </p>
            <div className="relative w-full h-48 rounded-lg overflow-hidden">
              <div className="w-full h-full bg-gradient-to-b from-orange-400 via-red-500 to-red-900 flex items-center justify-center">
                <span className="text-white/50 text-sm">Mission Image</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {page === 1 ? (
          <>
            {/* Date Field */}
            <Card className="bg-white rounded-lg">
              <CardContent className="p-6">
                <Label className="text-gray-800 font-normal">
                  Date <span className="text-red-600">*</span>
                </Label>
                <div className="mt-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[280px] justify-start text-left font-normal bg-white border-gray-300",
                          !formData.entryDate && "text-muted-foreground",
                          formData.entryDate && "text-gray-900"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                        {formData.entryDate ? (
                          format(new Date(formData.entryDate + "T00:00:00"), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.entryDate ? new Date(formData.entryDate + "T00:00:00") : undefined}
                        onSelect={(date) =>
                          setFormData((prev) => ({
                            ...prev,
                            entryDate: date ? format(date, "yyyy-MM-dd") : "",
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {errors.entryDate && (
                  <p className="text-red-600 text-sm mt-1">{errors.entryDate}</p>
                )}
              </CardContent>
            </Card>

            {/* Time Field */}
            <Card className="bg-white rounded-lg">
              <CardContent className="p-6">
                <Label className="text-gray-800 font-normal">
                  Time <span className="text-red-600">*</span>
                </Label>
                <div className="mt-4 space-y-3">
                  {timeOptions.map((time) => (
                    <div key={time} className="flex items-center space-x-3">
                      <Checkbox
                        id={`time-${time}`}
                        checked={formData.entryTime.includes(time)}
                        onCheckedChange={(checked) =>
                          handleTimeChange(time, checked as boolean)
                        }
                        className="border-gray-400"
                      />
                      <Label
                        htmlFor={`time-${time}`}
                        className="text-gray-700 font-normal cursor-pointer"
                      >
                        {time === "Other" ? "Other:" : time}
                      </Label>
                      {time === "Other" && formData.entryTime.includes("Other") && (
                        <Input
                          type="text"
                          placeholder="Specify time"
                          value={formData.entryTimeOther}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              entryTimeOther: e.target.value,
                            }))
                          }
                          className="flex-1 max-w-xs text-gray-900 placeholder:text-gray-400"
                        />
                      )}
                    </div>
                  ))}
                </div>
                {errors.entryTime && (
                  <p className="text-red-600 text-sm mt-2">{errors.entryTime}</p>
                )}
                {errors.entryTimeOther && (
                  <p className="text-red-600 text-sm mt-1">{errors.entryTimeOther}</p>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <Button
                onClick={handleNext}
                className="bg-white text-[#673ab7] border border-[#673ab7] hover:bg-[#673ab7] hover:text-white"
              >
                Next
              </Button>
              <div className="flex items-center gap-4">
                <Progress value={50} className="w-32 h-2" />
                <span className="text-gray-600 text-sm">Page 1 of 2</span>
              </div>
              <Button
                variant="link"
                onClick={handleClearForm}
                className="text-[#673ab7]"
              >
                Clear form
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Deep Work Hours */}
            <Card className="bg-white rounded-lg">
              <CardContent className="p-6">
                <Label className="text-gray-800 font-normal">
                  Deep Work Hrs: -12:45
                </Label>
                <Input
                  type="text"
                  placeholder="Your answer"
                  value={formData.deepWorkNoon}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, deepWorkNoon: e.target.value }))
                  }
                  className="mt-2 text-gray-900 placeholder:text-gray-400 border-gray-300"
                />
              </CardContent>
            </Card>

            <Card className="bg-white rounded-lg">
              <CardContent className="p-6">
                <Label className="text-gray-800 font-normal">
                  Deep Work Hrs: -3:45
                </Label>
                <Input
                  type="text"
                  placeholder="Your answer"
                  value={formData.deepWork245pm}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, deepWork245pm: e.target.value }))
                  }
                  className="mt-2 text-gray-900 placeholder:text-gray-400 border-gray-300"
                />
              </CardContent>
            </Card>

            <Card className="bg-white rounded-lg">
              <CardContent className="p-6">
                <Label className="text-gray-800 font-normal">
                  Deep Work Hrs: -6:45
                </Label>
                <Input
                  type="text"
                  placeholder="Your answer"
                  value={formData.deepWork545pm}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, deepWork545pm: e.target.value }))
                  }
                  className="mt-2 text-gray-900 placeholder:text-gray-400 border-gray-300"
                />
              </CardContent>
            </Card>

            <Card className="bg-white rounded-lg">
              <CardContent className="p-6">
                <Label className="text-gray-800 font-normal">
                  Deep Work Hrs: -EOD
                </Label>
                <Input
                  type="text"
                  placeholder="Your answer"
                  value={formData.deepWorkEod}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, deepWorkEod: e.target.value }))
                  }
                  className="mt-2 text-gray-900 placeholder:text-gray-400 border-gray-300"
                />
              </CardContent>
            </Card>

            {/* What'd you get done? */}
            <Card className="bg-white rounded-lg">
              <CardContent className="p-6">
                <Label className="text-gray-800 font-normal">
                  What&apos;d you get done?
                </Label>
                <Textarea
                  placeholder="Your answer"
                  value={formData.whatGotDone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, whatGotDone: e.target.value }))
                  }
                  className="mt-2 text-gray-900 placeholder:text-gray-400 border-gray-300"
                />
              </CardContent>
            </Card>

            {/* Improve how? */}
            <Card className="bg-white rounded-lg">
              <CardContent className="p-6">
                <Label className="text-gray-800 font-normal">Improve how?</Label>
                <Textarea
                  placeholder="Your answer"
                  value={formData.improveHow}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, improveHow: e.target.value }))
                  }
                  className="mt-2 text-gray-900 placeholder:text-gray-400 border-gray-300"
                />
              </CardContent>
            </Card>

            {/* Multi Select */}
            <Card className="bg-white rounded-lg">
              <CardContent className="p-6">
                <Label className="text-gray-800 font-normal">Multi Select</Label>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="clean-desk"
                      checked={formData.cleanDesk}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          cleanDesk: checked as boolean,
                        }))
                      }
                      className="border-gray-400"
                    />
                    <Label
                      htmlFor="clean-desk"
                      className="text-gray-700 font-normal cursor-pointer"
                    >
                      Clean Desk
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="clean-desktop"
                      checked={formData.cleanDesktop}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          cleanDesktop: checked as boolean,
                        }))
                      }
                      className="border-gray-400"
                    />
                    <Label
                      htmlFor="clean-desktop"
                      className="text-gray-700 font-normal cursor-pointer"
                    >
                      Clean Desktop
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PDF Question */}
            <Card className="bg-white rounded-lg">
              <CardContent className="p-6">
                <Label className="text-gray-800 font-normal">
                  working on any large .pdf&apos;s not yet added to Notebook, MCP, RAG,
                  Bookmark, print, Document?
                </Label>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="pdf-yes"
                      checked={formData.pdfStatus === "yes"}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          pdfStatus: checked ? "yes" : "",
                        }))
                      }
                      className="border-gray-400"
                    />
                    <Label
                      htmlFor="pdf-yes"
                      className="text-gray-700 font-normal cursor-pointer"
                    >
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="pdf-yes-added"
                      checked={formData.pdfStatus === "yes_added"}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          pdfStatus: checked ? "yes_added" : "",
                        }))
                      }
                      className="border-gray-400"
                    />
                    <Label
                      htmlFor="pdf-yes-added"
                      className="text-gray-700 font-normal cursor-pointer"
                    >
                      Yes; Added
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PDFs Added */}
            <Card className="bg-white rounded-lg">
              <CardContent className="p-6">
                <Label className="text-gray-800 font-normal">
                  what .pdf (s) were added?
                </Label>
                <Input
                  type="text"
                  placeholder="Your answer"
                  value={formData.pdfsAdded}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, pdfsAdded: e.target.value }))
                  }
                  className="mt-2 text-gray-900 placeholder:text-gray-400 border-gray-300"
                />
              </CardContent>
            </Card>

            {/* Notion Calendar Grade */}
            <Card className="bg-white rounded-lg">
              <CardContent className="p-6">
                <Label className="text-gray-800 font-normal">
                  Notion Calendar Grade <span className="text-red-600">*</span>
                </Label>
                <RadioGroup
                  value={formData.notionCalendarGrade}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      notionCalendarGrade: value,
                    }))
                  }
                  className="flex justify-center gap-4 mt-6 flex-wrap"
                >
                  {["C", "C+", "B-", "B", "B+", "A-", "A"].map((grade) => (
                    <div key={grade} className="flex flex-col items-center gap-2">
                      <span className="text-gray-700 text-sm">{grade}</span>
                      <RadioGroupItem
                        value={grade}
                        id={`grade-${grade}`}
                        className="border-gray-400"
                      />
                    </div>
                  ))}
                </RadioGroup>
                {errors.notionCalendarGrade && (
                  <p className="text-red-600 text-sm mt-2 text-center">
                    {errors.notionCalendarGrade}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Mood (New Field) */}
            <Card className="bg-white rounded-lg">
              <CardContent className="p-6">
                <Label className="text-gray-800 font-normal">
                  Mood <span className="text-red-600">*</span>
                </Label>
                <RadioGroup
                  value={formData.mood}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      mood: value,
                    }))
                  }
                  className="flex justify-center gap-4 mt-6 flex-wrap"
                >
                  {["C", "C+", "B-", "B", "B+", "A-", "A"].map((grade) => (
                    <div key={grade} className="flex flex-col items-center gap-2">
                      <span className="text-gray-700 text-sm">{grade}</span>
                      <RadioGroupItem
                        value={grade}
                        id={`mood-${grade}`}
                        className="border-gray-400"
                      />
                    </div>
                  ))}
                </RadioGroup>
                {errors.mood && (
                  <p className="text-red-600 text-sm mt-2 text-center">{errors.mood}</p>
                )}
              </CardContent>
            </Card>

            {/* Submit Error */}
            {errors.submit && (
              <p className="text-red-600 text-sm text-center">{errors.submit}</p>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="bg-white text-gray-700 border-gray-300"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-[#673ab7] text-white hover:bg-[#5e35a1]"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <Progress value={100} className="w-32 h-2" />
                <span className="text-gray-600 text-sm">Page 2 of 2</span>
              </div>
              <Button
                variant="link"
                onClick={handleClearForm}
                className="text-[#673ab7]"
              >
                Clear form
              </Button>
            </div>
          </>
        )}
        </div>
      </div>
    </>
  );
}
