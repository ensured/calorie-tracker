'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SettingsIcon } from 'lucide-react';

interface DailyTargets {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  vitaminA: number;
  vitaminC: number;
  calcium: number;
  iron: number;
  potassium: number;
}

const defaultTargets: DailyTargets = {
  calories: 2000,
  protein: 50,
  carbs: 275,
  fats: 78,
  vitaminA: 900,
  vitaminC: 90,
  calcium: 1000,
  iron: 18,
  potassium: 2500,
};

interface SettingsProps {
  onTargetsChange: (targets: DailyTargets) => void;
}

export default function Settings({ onTargetsChange }: SettingsProps) {
  const [targets, setTargets] = useState<DailyTargets>(defaultTargets);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load targets from localStorage on component mount
    const savedTargets = localStorage.getItem('dailyTargets');
    if (savedTargets) {
      const parsedTargets = JSON.parse(savedTargets);
      setTargets(parsedTargets);
    }
  }, []); // Only run on mount

  const handleTargetChange = (key: keyof DailyTargets, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newTargets = { ...targets, [key]: numValue };
    setTargets(newTargets);
  };

  const handleSave = () => {
    localStorage.setItem('dailyTargets', JSON.stringify(targets));
    onTargetsChange(targets);
    setIsOpen(false);
  };

  const handleReset = () => {
    setTargets(defaultTargets);
    localStorage.setItem('dailyTargets', JSON.stringify(defaultTargets));
    onTargetsChange(defaultTargets);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className='cursor-pointer' size='icon' >
          <SettingsIcon className='size-5' />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Daily Nutrition Targets</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Calories (kcal)</label>
              <Input
                type="number"
                value={targets.calories}
                onChange={(e) => handleTargetChange('calories', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Protein (g)</label>
              <Input
                type="number"
                value={targets.protein}
                onChange={(e) => handleTargetChange('protein', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Carbs (g)</label>
              <Input
                type="number"
                value={targets.carbs}
                onChange={(e) => handleTargetChange('carbs', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Fats (g)</label>
              <Input
                type="number"
                value={targets.fats}
                onChange={(e) => handleTargetChange('fats', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Vitamin A (mcg)</label>
              <Input
                type="number"
                value={targets.vitaminA}
                onChange={(e) => handleTargetChange('vitaminA', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Vitamin C (mg)</label>
              <Input
                type="number"
                value={targets.vitaminC}
                onChange={(e) => handleTargetChange('vitaminC', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Calcium (mg)</label>
              <Input
                type="number"
                value={targets.calcium}
                onChange={(e) => handleTargetChange('calcium', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Iron (mg)</label>
              <Input
                type="number"
                value={targets.iron}
                onChange={(e) => handleTargetChange('iron', e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Potassium (mg)</label>
              <Input
                type="number"
                value={targets.potassium}
                onChange={(e) => handleTargetChange('potassium', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              Save
            </Button>
            <Button onClick={handleReset} variant="outline">
              Reset to Defaults
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 