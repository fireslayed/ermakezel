import { useState } from "react";
import { TaskList } from "@/components/task-list";
import { TaskForm } from "@/components/task-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function Tasks() {
  const [activeTab, setActiveTab] = useState("all");
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
        <TaskForm />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Manage Tasks</CardTitle>
          <CardDescription>
            View, create, and manage your tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Tasks</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <TaskList />
            </TabsContent>
            <TabsContent value="pending">
              <TaskList />
            </TabsContent>
            <TabsContent value="completed">
              <TaskList />
            </TabsContent>
            <TabsContent value="overdue">
              <TaskList />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
