"use client"

import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function LeaderboardFilters() {
  return (
    <Card className="p-6">
      <h3 className="mb-4 font-bold">Filtros</h3>

      <div className="space-y-6">
        {/* Time Period */}
        <div>
          <Label className="mb-3 block text-sm font-semibold">Período</Label>
          <RadioGroup defaultValue="week">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="week" id="week" />
              <Label htmlFor="week" className="font-normal">
                Esta Semana
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="month" id="month" />
              <Label htmlFor="month" className="font-normal">
                Este Mes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="font-normal">
                Todo el Tiempo
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Scope */}
        <div>
          <Label className="mb-3 block text-sm font-semibold">Alcance</Label>
          <RadioGroup defaultValue="global">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="global" id="global" />
              <Label htmlFor="global" className="font-normal">
                Global
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="course" id="course" />
              <Label htmlFor="course" className="font-normal">
                Mi Curso
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="friends" id="friends" />
              <Label htmlFor="friends" className="font-normal">
                Amigos
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </Card>
  )
}
