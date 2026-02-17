import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DemoPage() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">
              Theme Demo
            </h1>
            <p className="text-muted-foreground text-lg">
              Showcase of the custom tweakcn theme
            </p>
          </div>

          <Separator />

          {/* Colors Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Color Palette</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <ColorCard name="Primary" color="bg-primary" text="primary" />
              <ColorCard name="Secondary" color="bg-secondary" text="secondary" />
              <ColorCard name="Accent" color="bg-accent" text="accent" />
              <ColorCard name="Muted" color="bg-muted" text="muted" />
              <ColorCard name="Card" color="bg-card" text="card" border />
              <ColorCard name="Background" color="bg-background" text="background" border />
              <ColorCard name="Destructive" color="bg-destructive" text="destructive" />
              <ColorCard name="Border" color="bg-border" text="border" border />
            </div>
          </section>

          <Separator />

          {/* Buttons Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Buttons</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Card Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Cards</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>
                    Card description with muted foreground color
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    This card demonstrates the card background, border radius,
                    and shadow from the custom theme.
                  </p>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </CardFooter>
              </Card>

              <Card className="bg-muted">
                <CardHeader>
                  <CardTitle>Muted Card</CardTitle>
                  <CardDescription>
                    Card with muted background
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    Shows how the muted color variable is applied.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button size="sm">Action</Button>
                </CardFooter>
              </Card>
            </div>
          </section>

          {/* Form Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Form Elements</h2>
            <Card>
              <CardHeader>
                <CardTitle>Input Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" placeholder="email@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="********" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disabled">Disabled Input</Label>
                  <Input id="disabled" disabled placeholder="Disabled field" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Cancel</Button>
                <Button>Submit</Button>
              </CardFooter>
            </Card>
          </section>

          {/* Tooltip Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Tooltips</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline">Hover me</Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Tooltip with theme colors</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="cursor-help">
                        Info
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>More information here</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Radius & Shadows Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Radius & Shadows</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-sm bg-card p-4 text-center text-sm shadow-sm border">
                sm radius
              </div>
              <div className="rounded-md bg-card p-4 text-center text-sm shadow border">
                md radius
              </div>
              <div className="rounded-lg bg-card p-4 text-center text-sm shadow-md border">
                lg radius
              </div>
              <div className="rounded-xl bg-card p-4 text-center text-sm shadow-lg border">
                xl radius
              </div>
              <div className="rounded-2xl bg-card p-4 text-center text-sm shadow-xl border">
                2xl radius
              </div>
              <div className="rounded-[1.4rem] bg-primary text-primary-foreground p-4 text-center text-sm shadow-2xl">
                Custom 1.4rem
              </div>
            </div>
          </section>

          {/* Footer */}
          <Separator />
          <footer className="text-center text-sm text-muted-foreground pb-8">
            <p>Custom tweakcn theme demo</p>
          </footer>
        </div>
      </div>
    </TooltipProvider>
  );
}

function ColorCard({
  name,
  color,
  text,
  border,
}: {
  name: string;
  color: string;
  text: string;
  border?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div
        className={`h-20 ${color} rounded-lg ${border ? "border border-border" : ""}`}
      />
      <div className="text-center">
        <p className="font-medium text-sm">{name}</p>
        <p className="text-xs text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
