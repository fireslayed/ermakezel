import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  
  const handleResetDemoData = () => {
    toast({
      title: "Demo data reset",
      description: "All demo data has been reset to default values",
    });
  };
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize the appearance of the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <span className="text-sm text-muted-foreground">
                  Toggle between light and dark mode
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Demo Data</CardTitle>
            <CardDescription>
              Manage the demo data for the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Reset Demo Data</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleResetDemoData}>
                  Reset to Default
                </Button>
                <span className="text-sm text-muted-foreground">
                  This will reset all tasks and projects to their default state
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
            <CardDescription>
              Information about TaskMaster Pro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">TaskMaster Pro</h3>
              <p className="text-sm text-muted-foreground">
                Version 2.0.0
              </p>
              <Separator className="my-4" />
              <p className="text-sm text-muted-foreground">
                TaskMaster Pro is a modern task management application designed to help you
                organize your work and personal tasks efficiently.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
