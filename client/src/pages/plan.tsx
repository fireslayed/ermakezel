import { useState, useRef, useEffect } from "react";
import { Plus, Move, Image, X, Layers, Search, Save, Trash2, FilePlus, Maximize2, Minimize2 } from "lucide-react";
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

// Plan sayfasında kullanılan veri tipleri
interface PlanPoint {
  id: string;
  x: number;
  y: number;
  notes: string[];
  images: string[];
  hasNotes: boolean;
  hasImages: boolean;
  color?: string; // Nokta rengi
}

interface BackgroundImageLayer {
  id: string;
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
  const cardRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [points, setPoints] = useState<PlanPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<PlanPoint | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [imageWidth, setImageWidth] = useState<number>(500);
  const [imageHeight, setImageHeight] = useState<number>(400);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showLayersPanel, setShowLayersPanel] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [pointColor, setPointColor] = useState<string>("green");
  
  // Kullanılabilir renk seçenekleri
  const colorOptions = [
    { value: "green", label: "Yeşil", class: "bg-green-600" },
    { value: "red", label: "Kırmızı", class: "bg-red-600" },
    { value: "blue", label: "Mavi", class: "bg-blue-600" },
    { value: "yellow", label: "Sarı", class: "bg-yellow-600" },
    { value: "purple", label: "Mor", class: "bg-purple-600" },
    { value: "pink", label: "Pembe", class: "bg-pink-600" },
  ];
  
  // Arkaplan görüntü katmanları için değişkenler
  const [backgroundImageLayers, setBackgroundImageLayers] = useState<BackgroundImageLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<BackgroundImageLayer | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [layerToDelete, setLayerToDelete] = useState<string | null>(null);
  
  // Plan yönetimi için değişkenler
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [showCreatePlanDialog, setShowCreatePlanDialog] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [showDeletePlanConfirm, setShowDeletePlanConfirm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Parça seçimi için değişkenler
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  
  // Planları getir
  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['/api/plans'],
  });
  
  // Eğer planlar yüklendiyse ve henüz bir plan seçilmediyse, ilk planı seç
  useEffect(() => {
    if (plans && Array.isArray(plans) && plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id.toString());
      loadPlan(plans[0]);
    }
  }, [plans, selectedPlanId]);
  
  // Seçili planı getir
  const { data: selectedPlan, isLoading: isLoadingSelectedPlan } = useQuery({
    queryKey: ['/api/plans', selectedPlanId],
    enabled: !!selectedPlanId,
  });
  
  // Seçili plan değiştiğinde planı yükle
  useEffect(() => {
    if (selectedPlan) {
      loadPlan(selectedPlan);
    }
  }, [selectedPlan]);
  
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
  
  // Handle toggle buttons
  const handleToggleChange = (value: string) => {
    setActiveTool(activeTool === value ? null : value);
  };
  
  // Tam sayfa görünümü
  const toggleFullscreen = () => {
    if (!cardRef.current) return;
    
    if (!isFullscreen) {
      if (cardRef.current.requestFullscreen) {
        cardRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };
  
  // Fullscreen değişikliklerini izle
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

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
      hasImages: false,
      color: pointColor // Seçili renk
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
      title: "Not kaydedildi",
      description: editingNoteIndex !== null ? "Not başarıyla güncellendi" : "Not başarıyla eklendi",
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
        title: "Maksimum resim sayısına ulaşıldı",
        description: "Bir nokta için en fazla 4 resim yükleyebilirsiniz",
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
      title: "Resim yüklendi",
      description: "Resim başarıyla eklendi",
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
      title: "Arkaplan resmi yüklendi",
      description: "Yeni resim katmanı tuvale eklendi",
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
      title: "Katman silindi",
      description: "Resim katmanı kaldırıldı",
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
  };
  
  // Handle image resize
  const handleImageResize = () => {
    if (!selectedLayerId) return;
    
    setBackgroundImageLayers(prevLayers => {
      return prevLayers.map(layer => {
        if (layer.id === selectedLayerId) {
          const updatedLayer = {
            ...layer,
            width: imageWidth,
            height: imageHeight
          };
          
          // Also update backgroundImage if this is the selected layer
          if (backgroundImage?.id === selectedLayerId) {
            setBackgroundImage(updatedLayer);
          }
          
          return updatedLayer;
        }
        return layer;
      });
    });
    
    toast({
      title: "Boyut değiştirildi",
      description: "Resim boyutu güncellendi",
    });
  };
  
  // Handle layer drag
  const handleLayerDrag = (layerId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const layerIndex = backgroundImageLayers.findIndex(l => l.id === layerId);
    if (layerIndex === -1) return;
    
    const layer = backgroundImageLayers[layerIndex];
    const initialX = layer.x;
    const initialY = layer.y;
    const startX = e.clientX;
    const startY = e.clientY;
    
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

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Plan</h2>
        
        <div className="flex items-center gap-4 flex-wrap">
          {/* Plan Seçimi */}
          <div className="flex items-center gap-2">
            <Select
              value={selectedPlanId}
              onValueChange={(value) => setSelectedPlanId(value)}
              disabled={isLoadingPlans}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Plan seçin" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(plans) && plans.length > 0 ? (
                  plans.map((plan: any) => (
                    <SelectItem key={plan.id} value={plan.id.toString()}>
                      {plan.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-plans" disabled>
                    Henüz plan yok
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowCreatePlanDialog(true)}
              title="Yeni plan oluştur"
            >
              <FilePlus className="h-4 w-4" />
            </Button>
            
            {selectedPlanId && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowDeletePlanConfirm(true)}
                title="Planı sil"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Resim boyutlandırma kontrolleri */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Resim boyutları:</label>
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
              Uygula
            </Button>
          </div>
          
          {/* Plan kaydetme */}
          <Button
            onClick={savePlan}
            disabled={!hasUnsavedChanges || (!selectedPlanId && (points.length === 0 && backgroundImageLayers.length === 0))}
            className={hasUnsavedChanges ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <Save className="mr-2 h-4 w-4" />
            Planı Kaydet
          </Button>
          
          {/* Renk Seçimi */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Nokta Rengi:</span>
            <div className="flex gap-1">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  className={`w-6 h-6 rounded-full ${color.class} border-2 ${
                    pointColor === color.value ? "border-white shadow-lg scale-110" : "border-transparent opacity-70"
                  } transition-all duration-200`}
                  onClick={() => setPointColor(color.value)}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          {/* Resim yükleme */}
          <div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleBackgroundImageUpload}
              className="hidden"
              id="background-image-upload"
            />
            <label htmlFor="background-image-upload">
              <Button variant="outline" asChild>
                <span>Resim Yükle</span>
              </Button>
            </label>
          </div>
          
          {/* Katmanlar paneli aç/kapat */}
          <Button
            variant="outline"
            onClick={() => setShowLayersPanel(!showLayersPanel)}
            className={showLayersPanel ? "bg-secondary" : ""}
          >
            <Layers className="mr-2 h-4 w-4" />
            Katmanlar
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-[1fr_250px] gap-4">
        <div className="order-2 md:order-1">
          <Card ref={cardRef} className={isFullscreen ? "h-screen w-screen flex flex-col" : ""}>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle>Plan Görünümü</CardTitle>
                <div className="flex items-center gap-2">
                  <ToggleGroup type="single" value={activeTool} onValueChange={handleToggleChange}>
                    <ToggleGroupItem value="add-point" aria-label="Nokta Ekle" title="Nokta Ekle">
                      <Plus className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="move" aria-label="Taşı" title="Taşı">
                      <Move className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="resize-image" aria-label="Boyutlandır" title="Boyutlandır">
                      <Image className="h-4 w-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                  
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={toggleFullscreen}
                    title={isFullscreen ? "Tam ekrandan çık" : "Tam ekran"}
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className={isFullscreen ? "flex-grow" : ""}>
              <div
                ref={canvasRef}
                className={`bg-secondary/30 relative w-full rounded-md overflow-hidden ${isFullscreen ? "h-full" : "min-h-[500px]"}`}
                onClick={handleCanvasClick}
                style={{ cursor: activeTool === "add-point" ? "crosshair" : "default" }}
              >
                {/* Background Image Layers */}
                {backgroundImageLayers.map((layer) => (
                  <div
                    key={layer.id}
                    className={`absolute transition-all ${
                      selectedLayerId === layer.id && activeTool === "move"
                        ? "outline outline-2 outline-primary cursor-move"
                        : ""
                    }`}
                    style={{
                      left: `${layer.x}px`,
                      top: `${layer.y}px`,
                      width: `${layer.width}px`,
                      height: `${layer.height}px`,
                      zIndex: selectedLayerId === layer.id ? 10 : 1,
                    }}
                    onClick={(e) => {
                      if (activeTool === "move") {
                        e.stopPropagation();
                        setSelectedLayerId(layer.id);
                        setBackgroundImage(layer);
                        setImageWidth(layer.width);
                        setImageHeight(layer.height);
                      }
                    }}
                    onMouseDown={activeTool === "move" ? (e) => handleLayerDrag(layer.id, e) : undefined}
                  >
                    <img
                      src={layer.url}
                      alt="Background"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ))}

                {/* Plus Points */}
                {points.map((point) => (
                  <div
                    key={point.id}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-20`}
                    style={{ left: point.x, top: point.y }}
                    onClick={(e) => handlePointClick(point, e)}
                  >
                    <div 
                      className={`
                        rounded-full w-8 h-8 flex items-center justify-center cursor-pointer 
                        transition-all duration-300 relative
                        ${point.hasNotes || point.hasImages 
                          ? `bg-${point.color || 'green'}-600 text-white shadow-lg` 
                          : `bg-${point.color || 'primary'} text-white hover:bg-${point.color || 'primary'}/90`
                        }
                      `}
                    >
                      <Plus className="h-5 w-5" />
                      
                      {/* Ses dalgası animasyonu */}
                      {(point.hasNotes || point.hasImages) && (
                        <>
                          <span className={`absolute w-8 h-8 bg-${point.color || 'green'}-400 rounded-full animate-ping opacity-75`}></span>
                          <span className={`absolute w-12 h-12 border-2 border-${point.color || 'green'}-400 rounded-full animate-pulse opacity-50`}></span>
                          <span className={`absolute w-16 h-16 border border-${point.color || 'green'}-300 rounded-full animate-pulse opacity-30`}></span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Layers Panel */}
        {showLayersPanel && (
          <div className="order-1 md:order-2">
            <Card>
              <CardHeader className="py-3">
                <CardTitle>Resim Katmanları</CardTitle>
              </CardHeader>
              <CardContent>
                {backgroundImageLayers.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>Henüz hiç resim katmanı eklenmemiş</p>
                    <p className="text-sm mt-2">Bir resim yüklemek için "Resim Yükle" butonunu kullanın</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {backgroundImageLayers.map((layer) => (
                      <div
                        key={layer.id}
                        className={`p-3 rounded-md border transition-colors cursor-pointer ${
                          selectedLayerId === layer.id ? "border-primary bg-primary/10" : "border-border hover:bg-accent"
                        }`}
                        onClick={() => handleSelectLayer(layer.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-12 w-12 bg-background rounded overflow-hidden">
                              <img
                                src={layer.url}
                                alt="Layer thumbnail"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="text-sm font-medium">Katman {backgroundImageLayers.indexOf(layer) + 1}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {layer.width} × {layer.height}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDeleteLayer(layer.id);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Delete Layer Confirm Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Katmanı sil?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu katmanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLayer}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Create Plan Dialog */}
      <Dialog open={showCreatePlanDialog} onOpenChange={setShowCreatePlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Plan Oluştur</DialogTitle>
            <DialogDescription>
              Plan için bir ad girin. Bu ad planı tanımlamak için kullanılacaktır.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="plan-name" className="text-sm font-medium">
                Plan Adı
              </label>
              <Input
                id="plan-name"
                placeholder="Örn. Plan 1, Üretim Planı, vb."
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePlanDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleCreatePlan} disabled={!newPlanName.trim()}>
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Plan Confirm Dialog */}
      <AlertDialog open={showDeletePlanConfirm} onOpenChange={setShowDeletePlanConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Planı sil?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu planı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm plan içeriği silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeletePlanConfirm(false)}>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlan}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Point Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nokta Detayları</DialogTitle>
            <DialogDescription>
              Bu noktaya notlar ve resimler ekleyin
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
                  placeholder="Bir not girin..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button onClick={handleAddNote}>
                  {editingNoteIndex !== null ? "Notu Güncelle" : "Not Ekle"}
                </Button>
              </div>
              
              {selectedPoint?.notes.length ? (
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-medium">Kaydedilen Notlar</h4>
                  {selectedPoint.notes.map((note, index) => (
                    <div key={index} className="p-3 border rounded-md flex justify-between items-start">
                      <p className="text-sm whitespace-pre-wrap">{note}</p>
                      <Button variant="ghost" size="sm" onClick={() => handleEditNote(index)}>
                        Düzenle
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Henüz not eklenmemiş</p>
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
                    <span>Resim Yükle (Maks 4)</span>
                  </Button>
                </label>
              </div>
              
              {selectedPoint?.images && selectedPoint.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 pt-4">
                  {selectedPoint.images.map((imageUrl, index) => (
                    <div key={index} className="relative border rounded-md overflow-hidden group">
                      <img src={imageUrl} alt={`Point image ${index + 1}`} className="w-full h-auto" />
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
                <p className="text-sm text-muted-foreground">Henüz resim eklenmemiş</p>
              )}
            </TabsContent>
            
            <TabsContent value="parts" className="space-y-4 pt-4">
              <PartsSelector 
                selectedPoint={selectedPoint}
                setPoints={setPoints}
                points={points}
                setSelectedPoint={setSelectedPoint}
              />
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