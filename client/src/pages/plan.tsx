import { useState, useRef, useEffect } from "react";
import { Plus, Move, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface PlanPoint {
  id: string;
  x: number;
  y: number;
  notes: string[];
  images: string[];
  hasNotes: boolean;
  hasImages: boolean;
}

interface BackgroundImage {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function Plan() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [points, setPoints] = useState<PlanPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<PlanPoint | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<BackgroundImage | null>(null);
  const [imageWidth, setImageWidth] = useState<number>(500);
  const [imageHeight, setImageHeight] = useState<number>(400);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Handle toggle buttons
  const handleToggleChange = (value: string) => {
    setActiveTool(activeTool === value ? null : value);
  };

  // Handle canvas click for adding plus markers
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== "add-point") return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPoint: PlanPoint = {
      id: Date.now().toString(),
      x,
      y,
      notes: [],
      images: [],
      hasNotes: false,
      hasImages: false
    };

    setPoints([...points, newPoint]);
    setSelectedPoint(newPoint);
    setIsDialogOpen(true);
  };

  // Handle point click
  const handlePointClick = (point: PlanPoint, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPoint(point);
    setIsDialogOpen(true);
  };

  // Add note to selected point
  const handleAddNote = () => {
    if (!newNote.trim() || !selectedPoint) return;

    const updatedPoints = points.map(point => {
      if (point.id === selectedPoint.id) {
        const updatedNotes = [...point.notes];
        
        if (editingNoteIndex !== null) {
          // Edit existing note
          updatedNotes[editingNoteIndex] = newNote;
        } else {
          // Add new note
          updatedNotes.push(newNote);
        }
        
        return {
          ...point,
          notes: updatedNotes,
          hasNotes: true
        };
      }
      return point;
    });

    setPoints(updatedPoints);
    setNewNote("");
    setEditingNoteIndex(null);
    
    // Update selected point reference
    const updatedPoint = updatedPoints.find(p => p.id === selectedPoint.id);
    if (updatedPoint) setSelectedPoint(updatedPoint);
    
    toast({
      title: "Note saved",
      description: editingNoteIndex !== null ? "Note updated successfully" : "Note added successfully",
    });
  };

  // Handle note edit
  const handleEditNote = (index: number) => {
    if (!selectedPoint) return;
    setNewNote(selectedPoint.notes[index]);
    setEditingNoteIndex(index);
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedPoint) return;

    const file = files[0];
    if (!file) return;

    // Check if we already have 4 images
    if (selectedPoint.images.length >= 4) {
      toast({
        title: "Maximum images reached",
        description: "You can only upload up to 4 images per point",
        variant: "destructive"
      });
      return;
    }

    // Create a URL for the image
    const imageUrl = URL.createObjectURL(file);
    
    const updatedPoints = points.map(point => {
      if (point.id === selectedPoint.id) {
        return {
          ...point,
          images: [...point.images, imageUrl],
          hasImages: true
        };
      }
      return point;
    });

    setPoints(updatedPoints);
    
    // Update selected point reference
    const updatedPoint = updatedPoints.find(p => p.id === selectedPoint.id);
    if (updatedPoint) setSelectedPoint(updatedPoint);
    
    toast({
      title: "Image uploaded",
      description: "Image has been added successfully",
    });
  };

  // Handle background image upload
  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const file = files[0];
    if (!file) return;

    setImageFile(file);
    const imageUrl = URL.createObjectURL(file);
    
    setBackgroundImage({
      url: imageUrl,
      x: 0,
      y: 0,
      width: imageWidth,
      height: imageHeight
    });
    
    toast({
      title: "Background image uploaded",
      description: "Image has been added to the canvas",
    });
  };

  // Handle image removal
  const handleRemoveImage = (index: number) => {
    if (!selectedPoint) return;

    const updatedPoints = points.map(point => {
      if (point.id === selectedPoint.id) {
        const updatedImages = [...point.images];
        updatedImages.splice(index, 1);
        
        return {
          ...point,
          images: updatedImages,
          hasImages: updatedImages.length > 0
        };
      }
      return point;
    });

    setPoints(updatedPoints);
    
    // Update selected point reference
    const updatedPoint = updatedPoints.find(p => p.id === selectedPoint.id);
    if (updatedPoint) setSelectedPoint(updatedPoint);
    
    toast({
      title: "Image removed",
      description: "Image has been removed successfully",
    });
  };

  // Handle image resize
  const handleImageResize = () => {
    if (!backgroundImage) return;
    
    setBackgroundImage({
      ...backgroundImage,
      width: imageWidth,
      height: imageHeight
    });
    
    toast({
      title: "Image resized",
      description: "Background image has been resized",
    });
  };

  // Handle drag for background image
  const handleImageMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== "move-image" || !backgroundImage) return;
    
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = backgroundImage.x;
    const initialY = backgroundImage.y;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      setBackgroundImage({
        ...backgroundImage,
        x: initialX + dx,
        y: initialY + dy
      });
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Plan</h2>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Image dimensions:</label>
            <Input 
              type="number" 
              value={imageWidth} 
              onChange={(e) => setImageWidth(parseInt(e.target.value) || 100)}
              className="w-20"
              min={50}
              disabled={activeTool !== "resize-image"}
            />
            <span>×</span>
            <Input 
              type="number" 
              value={imageHeight} 
              onChange={(e) => setImageHeight(parseInt(e.target.value) || 100)}
              className="w-20"
              min={50}
              disabled={activeTool !== "resize-image"}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleImageResize}
              disabled={activeTool !== "resize-image" || !backgroundImage}
            >
              Apply
            </Button>
          </div>
          
          <div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleBackgroundImageUpload}
              className="hidden"
              id="background-image-upload"
            />
            <label htmlFor="background-image-upload">
              <Button variant="outline" size="sm" asChild>
                <span>Upload Background</span>
              </Button>
            </label>
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Canvas Tools</CardTitle>
          <ToggleGroup type="single" variant="outline" className="justify-start">
            <ToggleGroupItem 
              value="move-image" 
              aria-label="Move Image"
              onClick={() => handleToggleChange("move-image")}
              data-state={activeTool === "move-image" ? "on" : "off"}
            >
              <Move className="h-4 w-4 mr-2" />
              Move Image
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="resize-image" 
              aria-label="Resize Image"
              onClick={() => handleToggleChange("resize-image")}
              data-state={activeTool === "resize-image" ? "on" : "off"}
            >
              <Image className="h-4 w-4 mr-2" />
              Resize Image
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="add-point" 
              aria-label="Add Point"
              onClick={() => handleToggleChange("add-point")}
              data-state={activeTool === "add-point" ? "on" : "off"}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Point
            </ToggleGroupItem>
          </ToggleGroup>
        </CardHeader>
        <CardContent>
          <div 
            ref={canvasRef} 
            className="relative w-full h-[600px] border border-border rounded-md overflow-hidden bg-gray-50 dark:bg-gray-900"
            onClick={handleCanvasClick}
          >
            {/* Background Image */}
            {backgroundImage && (
              <div 
                className="absolute cursor-move"
                style={{
                  left: `${backgroundImage.x}px`,
                  top: `${backgroundImage.y}px`,
                  width: `${backgroundImage.width}px`,
                  height: `${backgroundImage.height}px`,
                }}
                onMouseDown={handleImageMouseDown}
              >
                <img 
                  src={backgroundImage.url} 
                  alt="Background" 
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            
            {/* Points */}
            {points.map((point) => (
              <div
                key={point.id}
                className={`absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full flex items-center justify-center cursor-pointer z-10 ${
                  point.hasNotes && point.hasImages
                    ? "bg-red-500 animate-pulse"
                    : point.hasNotes
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-blue-500"
                }`}
                style={{ left: `${point.x}px`, top: `${point.y}px` }}
                onClick={(e) => handlePointClick(point, e)}
              >
                <Plus className="h-3 w-3 text-white" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Point Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Point Details</DialogTitle>
            <DialogDescription>
              Add notes and images to this point
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="notes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
            </TabsList>
            
            <TabsContent value="notes" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Enter a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button onClick={handleAddNote}>
                  {editingNoteIndex !== null ? "Update Note" : "Add Note"}
                </Button>
              </div>
              
              {selectedPoint?.notes.length ? (
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-medium">Saved Notes</h4>
                  {selectedPoint.notes.map((note, index) => (
                    <div key={index} className="p-3 border rounded-md flex justify-between items-start">
                      <p className="text-sm whitespace-pre-wrap">{note}</p>
                      <Button variant="ghost" size="sm" onClick={() => handleEditNote(index)}>
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No notes added yet</p>
              )}
            </TabsContent>
            
            <TabsContent value="images" className="space-y-4 pt-4">
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <Button variant="outline" asChild disabled={selectedPoint?.images && selectedPoint.images.length >= 4}>
                    <span>Upload Image (Max 4)</span>
                  </Button>
                </label>
              </div>
              
              {selectedPoint?.images && selectedPoint.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 pt-4">
                  {selectedPoint.images.map((image, index) => (
                    <div key={index} className="relative border rounded-md overflow-hidden group">
                      <img 
                        src={image} 
                        alt={`Point image ${index}`} 
                        className="w-full h-48 object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No images uploaded yet</p>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}