"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle, Lightbulb, Speaker, Monitor, Box, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// Define a type for a stage item
interface StageItem {
  id: string;
  name: string;
  category: string;
  icon?: React.ElementType; // Optional icon component
}

// Define a type for categories
interface StageCategory {
  name: string;
  label: string;
  icon: React.ElementType;
}

const categories: StageCategory[] = [
  { name: 'lighting', label: 'Lighting', icon: Lightbulb },
  { name: 'audio', label: 'Audio', icon: Speaker },
  { name: 'video', label: 'Video', icon: Monitor },
  { name: 'staging', label: 'Staging', icon: Box },
  { name: 'special_effects', label: 'Special Effects', icon: Sparkles },
];

const allStageItems: StageItem[] = [
  // Lighting
  { id: 'light-1', name: 'LED Wash Light', category: 'lighting', icon: Lightbulb },
  { id: 'light-2', name: 'Moving Head Spot', category: 'lighting', icon: Lightbulb },
  { id: 'light-3', name: 'Strobe Light', category: 'lighting', icon: Lightbulb },
  // Audio
  { id: 'audio-1', name: 'Line Array Speaker', category: 'audio', icon: Speaker },
  { id: 'audio-2', name: 'Subwoofer', category: 'audio', icon: Speaker },
  { id: 'audio-3', name: 'Wireless Microphone', category: 'audio', icon: Speaker },
  // Video
  { id: 'video-1', name: 'LED Video Wall Panel', category: 'video', icon: Monitor },
  { id: 'video-2', name: 'Projector', category: 'video', icon: Monitor },
  { id: 'video-3', name: 'Monitor Display', category: 'video', icon: Monitor },
  // Staging
  { id: 'stage-1', name: 'Stage Deck (4x8)', category: 'staging', icon: Box },
  { id: 'stage-2', name: 'Truss Section (10ft)', category: 'staging', icon: Box },
  { id: 'stage-3', name: 'Riser', category: 'staging', icon: Box },
  // Special Effects
  { id: 'effect-1', name: 'Fog Machine', category: 'special_effects', icon: Sparkles },
  { id: 'effect-2', name: 'Confetti Cannon', category: 'special_effects', icon: Sparkles },
  { id: 'effect-3', name: 'CO2 Jet', category: 'special_effects', icon: Sparkles },
];

interface StageItemSelectorProps {
  onAddItem: (item: StageItem) => void;
}

const StageItemSelector: React.FC<StageItemSelectorProps> = ({ onAddItem }) => {
  const [activeCategory, setActiveCategory] = useState(categories[0].name);

  const itemsInActiveCategory = allStageItems.filter(item => item.category === activeCategory);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle>Select Stage Items</CardTitle>
        <CardDescription>Browse and add elements to your stage design.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-0">
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex flex-grow">
          <TabsList className="flex flex-col h-full p-2 border-r"> {/* Vertical TabsList */}
            <ScrollArea className="flex-grow">
              {categories.map(category => {
                const Icon = category.icon;
                return (
                  <TabsTrigger
                    key={category.name}
                    value={category.name}
                    className="flex items-center justify-start gap-2 w-full px-3 py-2 mb-1"
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-grow text-left truncate">{category.label}</span>
                  </TabsTrigger>
                );
              })}
            </ScrollArea>
          </TabsList>
          <div className="flex-grow flex flex-col"> {/* Container for TabsContent */}
            <ScrollArea className="flex-grow p-4"> {/* ScrollArea for item list */}
              {categories.map(category => (
                <TabsContent key={category.name} value={category.name} className="mt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {itemsInActiveCategory.length > 0 ? (
                      itemsInActiveCategory.map(item => {
                        const ItemIcon = item.icon || PlusCircle; // Fallback icon
                        return (
                          <Button
                            key={item.id}
                            variant="outline"
                            className="flex items-center justify-between gap-2 h-auto py-3 px-4 text-left"
                            onClick={() => onAddItem(item)}
                          >
                            <div className="flex items-center gap-2">
                              <ItemIcon className="h-5 w-5 text-primary flex-shrink-0" />
                              <span className="flex-grow text-base font-medium truncate">{item.name}</span>
                            </div>
                            <PlusCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </Button>
                        );
                      })
                    ) : (
                      <p className="text-muted-foreground col-span-full text-center py-8">No items in this category yet.</p>
                    )}
                  </div>
                </TabsContent>
              ))}
            </ScrollArea>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StageItemSelector;