import { useState, useRef, useEffect } from "react";
import { Plus, Move, Image, X, Layers, Search, Save, Trash2, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

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

// Parça Seçici Bileşeni
interface PartsSelectorProps {
  selectedPoint: PlanPoint | null;
  setPoints: React.Dispatch<React.SetStateAction<PlanPoint[]>>;
  points: PlanPoint[];
  setSelectedPoint: React.Dispatch<React.SetStateAction<PlanPoint | null>>;
}

function PartsSelector({ selectedPoint, setPoints, points, setSelectedPoint }: PartsSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const { toast } = useToast();
  
  // Parçaları getir
  const { data: parts, isLoading } = useQuery({
    queryKey: ['/api/parts'],
    retry: 1,
  });
  
  // Filtreleme fonksiyonu
  const filteredParts = Array.isArray(parts) ? parts.filter(part => {
    const query = searchQuery.toLowerCase();
    return (
      part.name?.toLowerCase().includes(query) || 
      part.partNumber?.toLowerCase().includes(query)
    );
  }) : [];
  
  // Parça ekle
  const handleAddPartToPoint = () => {
    if (!selectedPoint) return;
    
    // Seçili parçaları al
    const partsToAdd = selectedParts.map(partId => {
      const part = filteredParts.find(p => p.id.toString() === partId);
      return part;
    }).filter(Boolean);
    
    if (partsToAdd.length === 0) {
      toast({
        title: "Seçim Yapılmadı",
        description: "Lütfen en az bir parça seçin",
        variant: "destructive",
      });
      return;
    }
    
    // Mevcut noktaya parçaları ekle (notes dizisine)
    const updatedPoints = points.map(point => {
      if (point.id === selectedPoint.id) {
        // Parça bilgilerini not olarak ekle
        const partNotes = partsToAdd.map(part => (
          `[PARÇA] ${part.name} (${part.partNumber})` +
          `${part.category ? ` - Kategori: ${part.category}` : ''}` +
          `${part.color ? ` - Renk: ${part.color}` : ''}`
        ));
        
        return {
          ...point,
          notes: [...point.notes, ...partNotes],
          hasNotes: true
        };
      }
      return point;
    });
    
    setPoints(updatedPoints);
    
    // Seçili noktayı güncelle
    const updatedPoint = updatedPoints.find(p => p.id === selectedPoint.id);
    if (updatedPoint) setSelectedPoint(updatedPoint);
    
    // Seçilmiş parçaları temizle
    setSelectedParts([]);
    
    toast({
      title: "Parçalar Eklendi",
      description: `${partsToAdd.length} parça başarıyla noktaya eklendi`,
    });
  };
  
  // Parça seçme işlevi
  const togglePartSelection = (partId: string) => {
    setSelectedParts(prev => {
      if (prev.includes(partId)) {
        return prev.filter(id => id !== partId);
      } else {
        return [...prev, partId];
      }
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Parça adı veya numarası ile ara"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button 
          onClick={handleAddPartToPoint}
          disabled={selectedParts.length === 0}
        >
          Ekle
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <p>Parçalar yükleniyor...</p>
        </div>
      ) : filteredParts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery ? (
            <p>"{searchQuery}" ile eşleşen parça bulunamadı</p>
          ) : (
            <p>Henüz hiç parça eklenmemiş. Parçalar sayfasından yeni parça ekleyebilirsiniz.</p>
          )}
        </div>
      ) : (
        <ScrollArea className="h-[320px] rounded-md border p-2">
          <div className="space-y-2">
            {filteredParts.map(part => (
              <div 
                key={part.id} 
                className={`p-3 rounded-md cursor-pointer transition-colors ${
                  selectedParts.includes(part.id.toString()) 
                    ? 'bg-primary/20 border border-primary/50' 
                    : 'hover:bg-accent border border-transparent'
                }`}
                onClick={() => togglePartSelection(part.id.toString())}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-medium">{part.name}</h4>
                    <p className="text-sm text-muted-foreground">{part.partNumber}</p>
                  </div>
                  <Badge variant="outline">{part.category || 'Diğer'}</Badge>
                </div>
                {part.description && (
                  <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {part.description.replace(/<[^>]*>/g, ' ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

export default function Plan() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
  const [showLayersPanel, setShowLayersPanel] = useState<boolean>(false);
  
  // Plan yönetimi için değişkenler
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [showCreatePlanDialog, setShowCreatePlanDialog] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [showDeletePlanConfirm, setShowDeletePlanConfirm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Planları getir
  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['/api/plans'],
    onSuccess: (data) => {
      // Eğer henüz bir plan seçilmediyse ve plan varsa ilk planı seç
      if (data && Array.isArray(data) && data.length > 0 && !selectedPlanId) {
        setSelectedPlanId(data[0].id.toString());
        loadPlan(data[0]);
      }
    }
  });
  
  // Seçili planı getir
  const { data: selectedPlan, isLoading: isLoadingSelectedPlan } = useQuery({
    queryKey: ['/api/plans', selectedPlanId],
    enabled: !!selectedPlanId,
    onSuccess: (data) => {
      if (data) {
        loadPlan(data);
      }
    }
  });
  
  // Plan oluşturma
  const createPlanMutation = useMutation({
    mutationFn: async (planData: { name: string }) => {
      return await apiRequest('/api/plans', {
        method: 'POST',
        body: JSON.stringify(planData),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/plans'] });
      setSelectedPlanId(data.id.toString());
      setShowCreatePlanDialog(false);
      setNewPlanName("");
      toast({
        title: "Plan oluşturuldu",
        description: "Yeni plan başarıyla oluşturuldu.",
      });
      
      // Yeni plan oluşturulduğunda noktaları ve arkaplan görüntülerini temizle
      setPoints([]);
      setBackgroundImageLayers([]);
      setBackgroundImage(null);
      setHasUnsavedChanges(false);
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Plan oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  // Plan güncelleme
  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      return await apiRequest(`/api/plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plans'] });
      toast({
        title: "Plan kaydedildi",
        description: "Plan başarıyla kaydedildi.",
      });
      setHasUnsavedChanges(false);
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Plan kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  // Plan silme
  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/plans/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plans'] });
      // Eğer silinecek plan seçili plan ise, başka bir planı seç veya boş göster
      if (Array.isArray(plans) && plans.length > 0) {
        const remainingPlans = plans.filter(p => p.id.toString() !== selectedPlanId);
        if (remainingPlans.length > 0) {
          setSelectedPlanId(remainingPlans[0].id.toString());
          loadPlan(remainingPlans[0]);
        } else {
          setSelectedPlanId("");
          setPoints([]);
          setBackgroundImageLayers([]);
          setBackgroundImage(null);
        }
      }
      
      setShowDeletePlanConfirm(false);
      toast({
        title: "Plan silindi",
        description: "Plan başarıyla silindi.",
      });
      setHasUnsavedChanges(false);
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Plan silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  // Plan yükleme fonksiyonu
  const loadPlan = (plan: any) => {
    if (plan && plan.content) {
      if (plan.content.points) {
        setPoints(plan.content.points.map((point: any) => ({
          ...point,
          hasNotes: Array.isArray(point.notes) && point.notes.length > 0,
          hasImages: Array.isArray(point.images) && point.images.length > 0
        })));
      } else {
        setPoints([]);
      }
      
      if (plan.content.backgroundImages) {
        setBackgroundImageLayers(plan.content.backgroundImages);
        if (plan.content.backgroundImages.length > 0) {
          setBackgroundImage(plan.content.backgroundImages[0]);
          setSelectedLayerId(plan.content.backgroundImages[0].id);
          setImageWidth(plan.content.backgroundImages[0].width);
          setImageHeight(plan.content.backgroundImages[0].height);
        } else {
          setBackgroundImage(null);
          setSelectedLayerId(null);
        }
      } else {
        setBackgroundImageLayers([]);
        setBackgroundImage(null);
        setSelectedLayerId(null);
      }
    } else {
      setPoints([]);
      setBackgroundImageLayers([]);
      setBackgroundImage(null);
      setSelectedLayerId(null);
    }
    setHasUnsavedChanges(false);
  };
  
  // Planı kaydet
  const savePlan = () => {
    if (!selectedPlanId) {
      setShowCreatePlanDialog(true);
      return;
    }
    
    const planContent = {
      backgroundImages: backgroundImageLayers,
      points
    };
    
    updatePlanMutation.mutate({
      id: selectedPlanId,
      data: {
        content: planContent
      }
    });
  };
  
  // Yeni plan oluştur
  const handleCreatePlan = () => {
    if (!newPlanName.trim()) {
      toast({
        title: "Plan adı gerekli",
        description: "Lütfen plan için bir ad girin.",
        variant: "destructive"
      });
      return;
    }
    
    createPlanMutation.mutate({ name: newPlanName });
  };
  
  // Plan sil
  const handleDeletePlan = () => {
    if (!selectedPlanId) return;
    deletePlanMutation.mutate(selectedPlanId);
  };
  
  // Plan değişikliklerini izle
  useEffect(() => {
    // Eğer noktalar veya arkaplan görüntüleri değişirse, kaydedilmemiş değişiklikler var demektir
    if (selectedPlanId) {
      setHasUnsavedChanges(true);
    }
  }, [points, backgroundImageLayers]);
  
  // Parça seçimi için değişkenler
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  
  // Parçaları getir
  const { data: parts, isLoading: isLoadingParts } = useQuery({
    queryKey: ['/api/parts'],
    retry: 1,
  });
  
  // Filtreleme fonksiyonu
  const filteredParts = Array.isArray(parts) ? parts.filter(part => {
    const query = searchQuery.toLowerCase();
    return (
      part.name?.toLowerCase().includes(query) || 
      part.partNumber?.toLowerCase().includes(query)
    );
  }) : [];
  
  // Parça seçme işlevi
  const togglePartSelection = (partId: string) => {
    setSelectedParts(prev => {
      if (prev.includes(partId)) {
        return prev.filter(id => id !== partId);
      } else {
        return [...prev, partId];
      }
    });
  };
  
  // Parça ekle
  const handleAddPartToPoint = () => {
    if (!selectedPoint) return;
    
    // Seçili parçaları al
    const partsToAdd = selectedParts.map(partId => {
      const part = filteredParts.find(p => p.id.toString() === partId);
      return part;
    }).filter(Boolean);
    
    if (partsToAdd.length === 0) {
      toast({
        title: "Seçim Yapılmadı",
        description: "Lütfen en az bir parça seçin",
        variant: "destructive",
      });
      return;
    }
    
    // Mevcut noktaya parçaları ekle (notes dizisine)
    const updatedPoints = points.map(point => {
      if (point.id === selectedPoint.id) {
        // Parça bilgilerini not olarak ekle
        const partNotes = partsToAdd.map(part => (
          `[PARÇA] ${part.name} (${part.partNumber})` +
          `${part.category ? ` - Kategori: ${part.category}` : ''}` +
          `${part.color ? ` - Renk: ${part.color}` : ''}`
        ));
        
        return {
          ...point,
          notes: [...point.notes, ...partNotes],
          hasNotes: true
        };
      }
      return point;
    });
    
    setPoints(updatedPoints);
    
    // Seçili noktayı güncelle
    const updatedPoint = updatedPoints.find(p => p.id === selectedPoint.id);
    if (updatedPoint) setSelectedPoint(updatedPoint);
    
    // Seçilmiş parçaları temizle
    setSelectedParts([]);
    
    toast({
      title: "Parçalar Eklendi",
      description: `${partsToAdd.length} parça başarıyla noktaya eklendi`,
    });
  };

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

  interface BackgroundImageLayer {
    id: string;
    url: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }
  
  const [backgroundImageLayers, setBackgroundImageLayers] = useState<BackgroundImageLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [layerToDelete, setLayerToDelete] = useState<string | null>(null);

  // Handle background image upload
  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const file = files[0];
    if (!file) return;

    setImageFile(file);
    const imageUrl = URL.createObjectURL(file);
    
    const newLayer: BackgroundImageLayer = {
      id: Date.now().toString(),
      url: imageUrl,
      x: 0,
      y: 0,
      width: imageWidth,
      height: imageHeight
    };
    
    setBackgroundImageLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    setBackgroundImage(newLayer);
    
    toast({
      title: "Background image uploaded",
      description: "New image layer has been added to the canvas",
    });
  };
  
  // Select a specific layer
  const handleSelectLayer = (layerId: string) => {
    setSelectedLayerId(layerId);
    const layer = backgroundImageLayers.find(l => l.id === layerId);
    if (layer) {
      setBackgroundImage(layer);
      setImageWidth(layer.width);
      setImageHeight(layer.height);
    }
  };
  
  // Confirm delete layer
  const confirmDeleteLayer = (layerId: string) => {
    setLayerToDelete(layerId);
    setShowDeleteConfirm(true);
  };
  
  // Delete a layer
  const handleDeleteLayer = () => {
    if (!layerToDelete) return;
    
    setBackgroundImageLayers(prev => prev.filter(layer => layer.id !== layerToDelete));
    
    // If we're deleting the selected layer, select another one or set to null
    if (selectedLayerId === layerToDelete) {
      const remainingLayers = backgroundImageLayers.filter(layer => layer.id !== layerToDelete);
      if (remainingLayers.length > 0) {
        setSelectedLayerId(remainingLayers[0].id);
        setBackgroundImage(remainingLayers[0]);
        setImageWidth(remainingLayers[0].width);
        setImageHeight(remainingLayers[0].height);
      } else {
        setSelectedLayerId(null);
        setBackgroundImage(null);
      }
    }
    
    setShowDeleteConfirm(false);
    setLayerToDelete(null);
    
    toast({
      title: "Layer deleted",
      description: "The image layer has been removed",
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
    if (!backgroundImage || !selectedLayerId) return;
    
    // Update the selected layer in our layers array
    const updatedLayers = backgroundImageLayers.map(layer => {
      if (layer.id === selectedLayerId) {
        return {
          ...layer,
          width: imageWidth,
          height: imageHeight
        };
      }
      return layer;
    });
    
    setBackgroundImageLayers(updatedLayers);
    
    // Also update the current background image
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
  const handleImageMouseDown = (e: React.MouseEvent, layerId: string) => {
    if (activeTool !== "move-image") return;
    
    // Find the layer in our layers array
    const layerIndex = backgroundImageLayers.findIndex(layer => layer.id === layerId);
    if (layerIndex === -1) return;
    
    const layer = backgroundImageLayers[layerIndex];
    
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = layer.x;
    const initialY = layer.y;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      // Update this specific layer's position
      const updatedLayers = [...backgroundImageLayers];
      updatedLayers[layerIndex] = {
        ...layer,
        x: initialX + dx,
        y: initialY + dy
      };
      
      setBackgroundImageLayers(updatedLayers);
      
      // If this is the selected layer, also update the backgroundImage state
      if (selectedLayerId === layerId) {
        setBackgroundImage({
          ...layer,
          x: initialX + dx,
          y: initialY + dy
        });
      }
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
              disabled={activeTool !== "resize-image" || !selectedLayerId}
            />
            <span>×</span>
            <Input 
              type="number" 
              value={imageHeight} 
              onChange={(e) => setImageHeight(parseInt(e.target.value) || 100)}
              className="w-20"
              min={50}
              disabled={activeTool !== "resize-image" || !selectedLayerId}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleImageResize}
              disabled={activeTool !== "resize-image" || !selectedLayerId}
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
                <span>Resim Katmanı Ekle</span>
              </Button>
            </label>
          </div>
          
          {selectedLayerId && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => confirmDeleteLayer(selectedLayerId)}
              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              Katmanı Sil
            </Button>
          )}
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
              Resmi Taşı
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="resize-image" 
              aria-label="Resize Image"
              onClick={() => handleToggleChange("resize-image")}
              data-state={activeTool === "resize-image" ? "on" : "off"}
            >
              <Image className="h-4 w-4 mr-2" />
              Resmi Boyutlandır
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="add-point" 
              aria-label="Add Point"
              onClick={() => handleToggleChange("add-point")}
              data-state={activeTool === "add-point" ? "on" : "off"}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nokta Ekle
            </ToggleGroupItem>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLayersPanel(!showLayersPanel)}
              className="ml-2"
            >
              <Layers className="h-4 w-4 mr-2" />
              {showLayersPanel ? "Katmanları Gizle" : "Katmanları Göster"}
            </Button>
          </ToggleGroup>
        </CardHeader>
        <CardContent>
          {showLayersPanel && (
            <div className="flex space-x-4 mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Layers className="h-4 w-4 mr-1" />
                  Resim Katmanları
                </h3>
                <div className="border rounded-md p-2 max-h-32 overflow-y-auto space-y-2">
                  {backgroundImageLayers.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-2">
                      Henüz hiç resim katmanı eklenmemiş. Katman eklemek için "Resim Katmanı Ekle" butonuna tıklayın.
                    </div>
                  ) : (
                    backgroundImageLayers.map((layer, index) => (
                      <div
                        key={layer.id}
                        onClick={() => handleSelectLayer(layer.id)}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                          selectedLayerId === layer.id 
                            ? "bg-primary/10 border border-primary/50" 
                            : "hover:bg-accent"
                        }`}
                      >
                        <div className="flex items-center">
                          <div 
                            className="w-6 h-6 mr-2 border border-border overflow-hidden rounded-sm"
                            style={{ 
                              backgroundImage: `url(${layer.url})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          />
                          <span className="text-sm font-medium">Katman {index + 1}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-100/50"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDeleteLayer(layer.id);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          <div 
            ref={canvasRef} 
            className="relative w-full h-[600px] border border-border rounded-md overflow-hidden bg-gray-50 dark:bg-gray-900"
            onClick={handleCanvasClick}
          >
            {/* Background Image Layers */}
            {backgroundImageLayers.map((layer) => (
              <div 
                key={layer.id}
                className={`absolute cursor-move ${selectedLayerId === layer.id ? 'ring-2 ring-primary' : ''}`}
                style={{
                  left: `${layer.x}px`,
                  top: `${layer.y}px`,
                  width: `${layer.width}px`,
                  height: `${layer.height}px`,
                  zIndex: selectedLayerId === layer.id ? 5 : 1 // Higher z-index for selected layer
                }}
                onMouseDown={(e) => handleImageMouseDown(e, layer.id)}
                onClick={() => handleSelectLayer(layer.id)}
              >
                <img 
                  src={layer.url} 
                  alt={`Layer ${layer.id}`} 
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
            
            {/* Points */}
            {points.map((point) => (
              <div
                key={point.id}
                className={`absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full flex items-center justify-center cursor-pointer z-10 ${
                  point.hasNotes && point.hasImages
                    ? "bg-red-500 animate-wave"
                    : point.hasNotes
                    ? "bg-yellow-500 animate-wave-yellow"
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
      
      {/* Delete Layer Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resim Katmanını Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu resim katmanını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLayer}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="notes">Notlar</TabsTrigger>
              <TabsTrigger value="images">Resimler</TabsTrigger>
              <TabsTrigger value="parts">Parçalar</TabsTrigger>
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
            
            <TabsContent value="parts" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Parça adı veya numarası ile ara"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Button 
                    onClick={handleAddPartToPoint}
                    disabled={selectedParts.length === 0}
                  >
                    Ekle
                  </Button>
                </div>
                
                {isLoadingParts ? (
                  <div className="flex items-center justify-center py-8">
                    <p>Parçalar yükleniyor...</p>
                  </div>
                ) : Array.isArray(parts) && parts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Henüz hiç parça eklenmemiş. Parçalar sayfasından yeni parça ekleyebilirsiniz.</p>
                  </div>
                ) : filteredParts.length === 0 && searchQuery ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>"{searchQuery}" ile eşleşen parça bulunamadı</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[320px] rounded-md border p-2">
                    <div className="space-y-2">
                      {filteredParts.map((part: any) => (
                        <div 
                          key={part.id} 
                          className={`p-3 rounded-md cursor-pointer transition-colors ${
                            selectedParts.includes(part.id.toString()) 
                              ? 'bg-primary/20 border border-primary/50' 
                              : 'hover:bg-accent border border-transparent'
                          }`}
                          onClick={() => togglePartSelection(part.id.toString())}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="font-medium">{part.name}</h4>
                              <p className="text-sm text-muted-foreground">{part.partNumber}</p>
                            </div>
                            <Badge variant="outline">{part.category || 'Diğer'}</Badge>
                          </div>
                          {part.description && (
                            <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
                              {part.description.replace(/<[^>]*>/g, ' ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}