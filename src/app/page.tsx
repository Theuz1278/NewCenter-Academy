"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { 
  Calculator, 
  Apple, 
  Target, 
  Bell, 
  User, 
  Plus, 
  Minus, 
  Flame, 
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react'

// Tipos de dados
interface UserProfile {
  age: number
  gender: 'male' | 'female'
  weight: number
  height: number
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  goal: 'lose' | 'maintain' | 'gain'
}

interface Food {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  serving: string
}

interface ConsumedFood {
  food: Food
  quantity: number
  timestamp: Date
}

interface DailyGoals {
  calories: number
  protein: number
  carbs: number
  fat: number
  water: number
  exercise: number
}

interface Notification {
  id: string
  message: string
  type: 'reminder' | 'achievement' | 'warning'
  timestamp: Date
  read: boolean
}

// Base de dados de alimentos
const FOODS_DATABASE: Food[] = [
  { id: '1', name: 'Arroz branco (1 xícara)', calories: 205, protein: 4.3, carbs: 45, fat: 0.4, serving: '1 xícara' },
  { id: '2', name: 'Feijão preto (1 xícara)', calories: 227, protein: 15.2, carbs: 40.8, fat: 0.9, serving: '1 xícara' },
  { id: '3', name: 'Peito de frango grelhado (100g)', calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: '100g' },
  { id: '4', name: 'Banana média', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, serving: '1 unidade' },
  { id: '5', name: 'Maçã média', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, serving: '1 unidade' },
  { id: '6', name: 'Pão integral (2 fatias)', calories: 160, protein: 8, carbs: 28, fat: 2, serving: '2 fatias' },
  { id: '7', name: 'Ovos (2 unidades)', calories: 140, protein: 12, carbs: 1, fat: 10, serving: '2 unidades' },
  { id: '8', name: 'Leite desnatado (1 copo)', calories: 83, protein: 8.3, carbs: 12, fat: 0.2, serving: '200ml' },
  { id: '9', name: 'Batata doce (100g)', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, serving: '100g' },
  { id: '10', name: 'Salmão grelhado (100g)', calories: 208, protein: 25.4, carbs: 0, fat: 12.4, serving: '100g' },
  { id: '11', name: 'Aveia (1/2 xícara)', calories: 150, protein: 5, carbs: 27, fat: 3, serving: '1/2 xícara' },
  { id: '12', name: 'Iogurte natural (1 pote)', calories: 100, protein: 10, carbs: 12, fat: 0, serving: '170g' },
  { id: '13', name: 'Brócolis cozido (1 xícara)', calories: 55, protein: 4, carbs: 11, fat: 0.6, serving: '1 xícara' },
  { id: '14', name: 'Castanha do Pará (5 unidades)', calories: 165, protein: 3.6, carbs: 3, fat: 16.8, serving: '5 unidades' },
  { id: '15', name: 'Quinoa cozida (1 xícara)', calories: 222, protein: 8, carbs: 39, fat: 3.6, serving: '1 xícara' }
]

export default function CalorieTrackerApp() {
  // Estados principais
  const [activeTab, setActiveTab] = useState('dashboard')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [consumedFoods, setConsumedFoods] = useState<ConsumedFood[]>([])
  const [dailyGoals, setDailyGoals] = useState<DailyGoals>({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 67,
    water: 8,
    exercise: 30
  })
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [waterIntake, setWaterIntake] = useState(0)
  const [exerciseMinutes, setExerciseMinutes] = useState(0)

  // Cálculo da Taxa Metabólica Basal (TMB)
  const calculateBMR = (profile: UserProfile): number => {
    let bmr: number
    
    if (profile.gender === 'male') {
      bmr = 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age)
    } else {
      bmr = 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age)
    }

    // Multiplicador por nível de atividade
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    }

    const tdee = bmr * activityMultipliers[profile.activityLevel]

    // Ajuste baseado no objetivo
    switch (profile.goal) {
      case 'lose':
        return Math.round(tdee - 500) // Déficit de 500 calorias
      case 'gain':
        return Math.round(tdee + 500) // Superávit de 500 calorias
      default:
        return Math.round(tdee)
    }
  }

  // Cálculos dos totais consumidos
  const getTodayTotals = () => {
    const today = new Date().toDateString()
    const todayFoods = consumedFoods.filter(item => 
      item.timestamp.toDateString() === today
    )

    return todayFoods.reduce((totals, item) => ({
      calories: totals.calories + (item.food.calories * item.quantity),
      protein: totals.protein + (item.food.protein * item.quantity),
      carbs: totals.carbs + (item.food.carbs * item.quantity),
      fat: totals.fat + (item.food.fat * item.quantity)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
  }

  // Adicionar alimento consumido
  const addConsumedFood = (food: Food, quantity: number) => {
    const newConsumedFood: ConsumedFood = {
      food,
      quantity,
      timestamp: new Date()
    }
    setConsumedFoods(prev => [...prev, newConsumedFood])
    
    // Notificação de sucesso
    toast.success(`${food.name} adicionado com sucesso!`)
    
    // Verificar se atingiu metas
    checkGoalAchievements()
  }

  // Verificar conquistas de metas
  const checkGoalAchievements = () => {
    const totals = getTodayTotals()
    const newNotifications: Notification[] = []

    if (totals.calories >= dailyGoals.calories * 0.9) {
      newNotifications.push({
        id: Date.now().toString(),
        message: 'Parabéns! Você está próximo da sua meta de calorias diária!',
        type: 'achievement',
        timestamp: new Date(),
        read: false
      })
    }

    if (waterIntake >= dailyGoals.water) {
      newNotifications.push({
        id: (Date.now() + 1).toString(),
        message: 'Meta de hidratação atingida! Excelente trabalho!',
        type: 'achievement',
        timestamp: new Date(),
        read: false
      })
    }

    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev])
    }
  }

  // Gerar notificações automáticas
  useEffect(() => {
    const generateReminders = () => {
      const now = new Date()
      const hour = now.getHours()
      
      const reminders: Notification[] = []

      // Lembrete de café da manhã
      if (hour === 8) {
        reminders.push({
          id: `breakfast-${Date.now()}`,
          message: 'Hora do café da manhã! Não esqueça de registrar sua refeição.',
          type: 'reminder',
          timestamp: new Date(),
          read: false
        })
      }

      // Lembrete de almoço
      if (hour === 12) {
        reminders.push({
          id: `lunch-${Date.now()}`,
          message: 'Hora do almoço! Lembre-se de fazer escolhas saudáveis.',
          type: 'reminder',
          timestamp: new Date(),
          read: false
        })
      }

      // Lembrete de jantar
      if (hour === 19) {
        reminders.push({
          id: `dinner-${Date.now()}`,
          message: 'Hora do jantar! Registre sua última refeição do dia.',
          type: 'reminder',
          timestamp: new Date(),
          read: false
        })
      }

      // Lembrete de água
      if (hour % 2 === 0 && waterIntake < dailyGoals.water) {
        reminders.push({
          id: `water-${Date.now()}`,
          message: 'Hora de beber água! Mantenha-se hidratado.',
          type: 'reminder',
          timestamp: new Date(),
          read: false
        })
      }

      if (reminders.length > 0) {
        setNotifications(prev => [...reminders, ...prev])
      }
    }

    const interval = setInterval(generateReminders, 60000) // Verifica a cada minuto
    return () => clearInterval(interval)
  }, [waterIntake, dailyGoals.water])

  const totals = getTodayTotals()
  const caloriesRemaining = userProfile ? calculateBMR(userProfile) - totals.calories : dailyGoals.calories - totals.calories

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Flame className="text-orange-500" />
            NutriTracker
          </h1>
          <p className="text-gray-600">Seu assistente pessoal de nutrição e saúde</p>
        </div>

        {/* Notificações */}
        {notifications.filter(n => !n.read).length > 0 && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <Bell className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Você tem {notifications.filter(n => !n.read).length} notificação(ões) não lida(s)!
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="foods" className="flex items-center gap-2">
              <Apple className="w-4 h-4" />
              <span className="hidden sm:inline">Alimentos</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Metas</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Avisos</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-orange-400 to-red-500 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Flame className="w-5 h-5" />
                    Calorias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totals.calories}</div>
                  <div className="text-sm opacity-90">
                    Restam: {caloriesRemaining > 0 ? caloriesRemaining : 0}
                  </div>
                  <Progress 
                    value={userProfile ? (totals.calories / calculateBMR(userProfile)) * 100 : (totals.calories / dailyGoals.calories) * 100} 
                    className="mt-2 bg-white/20" 
                  />
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Proteína</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(totals.protein)}g</div>
                  <div className="text-sm opacity-90">Meta: {dailyGoals.protein}g</div>
                  <Progress 
                    value={(totals.protein / dailyGoals.protein) * 100} 
                    className="mt-2 bg-white/20" 
                  />
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-400 to-emerald-500 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Carboidratos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(totals.carbs)}g</div>
                  <div className="text-sm opacity-90">Meta: {dailyGoals.carbs}g</div>
                  <Progress 
                    value={(totals.carbs / dailyGoals.carbs) * 100} 
                    className="mt-2 bg-white/20" 
                  />
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-400 to-pink-500 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Gorduras</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(totals.fat)}g</div>
                  <div className="text-sm opacity-90">Meta: {dailyGoals.fat}g</div>
                  <Progress 
                    value={(totals.fat / dailyGoals.fat) * 100} 
                    className="mt-2 bg-white/20" 
                  />
                </CardContent>
              </Card>
            </div>

            {/* Hidratação e Exercício */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                    Hidratação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold">{waterIntake} copos</span>
                    <span className="text-sm text-gray-600">Meta: {dailyGoals.water} copos</span>
                  </div>
                  <Progress value={(waterIntake / dailyGoals.water) * 100} className="mb-4" />
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setWaterIntake(prev => prev + 1)}
                      size="sm"
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                    <Button 
                      onClick={() => setWaterIntake(prev => Math.max(0, prev - 1))}
                      size="sm"
                      variant="outline"
                    >
                      <Minus className="w-4 h-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-6 h-6 text-green-500" />
                    Exercício
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold">{exerciseMinutes} min</span>
                    <span className="text-sm text-gray-600">Meta: {dailyGoals.exercise} min</span>
                  </div>
                  <Progress value={(exerciseMinutes / dailyGoals.exercise) * 100} className="mb-4" />
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setExerciseMinutes(prev => prev + 15)}
                      size="sm"
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      +15 min
                    </Button>
                    <Button 
                      onClick={() => setExerciseMinutes(prev => Math.max(0, prev - 15))}
                      size="sm"
                      variant="outline"
                    >
                      <Minus className="w-4 h-4 mr-1" />
                      -15 min
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Refeições de hoje */}
            <Card>
              <CardHeader>
                <CardTitle>Refeições de Hoje</CardTitle>
              </CardHeader>
              <CardContent>
                {consumedFoods.filter(item => 
                  item.timestamp.toDateString() === new Date().toDateString()
                ).length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Nenhuma refeição registrada hoje. Vá para a aba "Alimentos" para adicionar!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {consumedFoods
                      .filter(item => item.timestamp.toDateString() === new Date().toDateString())
                      .map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{item.food.name}</div>
                            <div className="text-sm text-gray-600">
                              Quantidade: {item.quantity} • {Math.round(item.food.calories * item.quantity)} cal
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {item.timestamp.toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </Badge>
                        </div>
                      ))
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Perfil */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription>
                  Configure seus dados para calcular suas necessidades calóricas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age">Idade</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Ex: 25"
                      value={userProfile?.age || ''}
                      onChange={(e) => setUserProfile(prev => ({
                        ...prev!,
                        age: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Sexo</Label>
                    <Select
                      value={userProfile?.gender || ''}
                      onValueChange={(value: 'male' | 'female') => 
                        setUserProfile(prev => ({ ...prev!, gender: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="Ex: 70"
                      value={userProfile?.weight || ''}
                      onChange={(e) => setUserProfile(prev => ({
                        ...prev!,
                        weight: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Altura (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="Ex: 175"
                      value={userProfile?.height || ''}
                      onChange={(e) => setUserProfile(prev => ({
                        ...prev!,
                        height: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="activity">Nível de Atividade</Label>
                  <Select
                    value={userProfile?.activityLevel || ''}
                    onValueChange={(value: UserProfile['activityLevel']) => 
                      setUserProfile(prev => ({ ...prev!, activityLevel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione seu nível de atividade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentário (pouco ou nenhum exercício)</SelectItem>
                      <SelectItem value="light">Levemente ativo (exercício leve 1-3 dias/semana)</SelectItem>
                      <SelectItem value="moderate">Moderadamente ativo (exercício moderado 3-5 dias/semana)</SelectItem>
                      <SelectItem value="active">Ativo (exercício pesado 6-7 dias/semana)</SelectItem>
                      <SelectItem value="very_active">Muito ativo (exercício muito pesado, trabalho físico)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="goal">Objetivo</Label>
                  <Select
                    value={userProfile?.goal || ''}
                    onValueChange={(value: UserProfile['goal']) => 
                      setUserProfile(prev => ({ ...prev!, goal: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione seu objetivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lose">Perder peso</SelectItem>
                      <SelectItem value="maintain">Manter peso</SelectItem>
                      <SelectItem value="gain">Ganhar peso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={() => {
                    if (userProfile && userProfile.age && userProfile.gender && userProfile.weight && userProfile.height && userProfile.activityLevel && userProfile.goal) {
                      const calculatedCalories = calculateBMR(userProfile)
                      setDailyGoals(prev => ({ ...prev, calories: calculatedCalories }))
                      toast.success(`Perfil salvo! Sua meta diária é de ${calculatedCalories} calorias.`)
                    } else {
                      toast.error('Por favor, preencha todos os campos.')
                    }
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Calcular Necessidades Calóricas
                </Button>

                {userProfile && userProfile.age && userProfile.gender && userProfile.weight && userProfile.height && userProfile.activityLevel && userProfile.goal && (
                  <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          {calculateBMR(userProfile)} calorias/dia
                        </div>
                        <div className="text-sm text-gray-600">
                          Baseado no seu perfil e objetivo de {
                            userProfile.goal === 'lose' ? 'perder peso' :
                            userProfile.goal === 'gain' ? 'ganhar peso' : 'manter peso'
                          }
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alimentos */}
          <TabsContent value="foods" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Apple className="w-5 h-5" />
                  Adicionar Alimentos
                </CardTitle>
                <CardDescription>
                  Selecione alimentos e registre o que você consumiu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {FOODS_DATABASE.map((food) => (
                    <Card key={food.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="font-medium mb-2">{food.name}</div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>Calorias:</span>
                            <span className="font-medium">{food.calories}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Proteína:</span>
                            <span>{food.protein}g</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Carboidratos:</span>
                            <span>{food.carbs}g</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Gordura:</span>
                            <span>{food.fat}g</span>
                          </div>
                        </div>
                        <Separator className="my-3" />
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="Qtd"
                            min="0.1"
                            step="0.1"
                            className="w-20"
                            id={`quantity-${food.id}`}
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              const quantityInput = document.getElementById(`quantity-${food.id}`) as HTMLInputElement
                              const quantity = parseFloat(quantityInput.value) || 1
                              addConsumedFood(food, quantity)
                              quantityInput.value = ''
                            }}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Porção: {food.serving}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metas */}
          <TabsContent value="goals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Personalizar Metas Diárias
                </CardTitle>
                <CardDescription>
                  Ajuste suas metas de acordo com suas necessidades
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="calories-goal">Meta de Calorias</Label>
                    <Input
                      id="calories-goal"
                      type="number"
                      value={dailyGoals.calories}
                      onChange={(e) => setDailyGoals(prev => ({
                        ...prev,
                        calories: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="protein-goal">Meta de Proteína (g)</Label>
                    <Input
                      id="protein-goal"
                      type="number"
                      value={dailyGoals.protein}
                      onChange={(e) => setDailyGoals(prev => ({
                        ...prev,
                        protein: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="carbs-goal">Meta de Carboidratos (g)</Label>
                    <Input
                      id="carbs-goal"
                      type="number"
                      value={dailyGoals.carbs}
                      onChange={(e) => setDailyGoals(prev => ({
                        ...prev,
                        carbs: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fat-goal">Meta de Gorduras (g)</Label>
                    <Input
                      id="fat-goal"
                      type="number"
                      value={dailyGoals.fat}
                      onChange={(e) => setDailyGoals(prev => ({
                        ...prev,
                        fat: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="water-goal">Meta de Água (copos)</Label>
                    <Input
                      id="water-goal"
                      type="number"
                      value={dailyGoals.water}
                      onChange={(e) => setDailyGoals(prev => ({
                        ...prev,
                        water: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="exercise-goal">Meta de Exercício (min)</Label>
                    <Input
                      id="exercise-goal"
                      type="number"
                      value={dailyGoals.exercise}
                      onChange={(e) => setDailyGoals(prev => ({
                        ...prev,
                        exercise: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                </div>

                <Button 
                  onClick={() => toast.success('Metas atualizadas com sucesso!')}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Salvar Metas
                </Button>
              </CardContent>
            </Card>

            {/* Progresso das metas */}
            <Card>
              <CardHeader>
                <CardTitle>Progresso de Hoje</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Calorias</span>
                      <span>{totals.calories} / {dailyGoals.calories}</span>
                    </div>
                    <Progress value={(totals.calories / dailyGoals.calories) * 100} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Proteína</span>
                      <span>{Math.round(totals.protein)}g / {dailyGoals.protein}g</span>
                    </div>
                    <Progress value={(totals.protein / dailyGoals.protein) * 100} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Carboidratos</span>
                      <span>{Math.round(totals.carbs)}g / {dailyGoals.carbs}g</span>
                    </div>
                    <Progress value={(totals.carbs / dailyGoals.carbs) * 100} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Gorduras</span>
                      <span>{Math.round(totals.fat)}g / {dailyGoals.fat}g</span>
                    </div>
                    <Progress value={(totals.fat / dailyGoals.fat) * 100} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Água</span>
                      <span>{waterIntake} / {dailyGoals.water} copos</span>
                    </div>
                    <Progress value={(waterIntake / dailyGoals.water) * 100} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Exercício</span>
                      <span>{exerciseMinutes} / {dailyGoals.exercise} min</span>
                    </div>
                    <Progress value={(exerciseMinutes / dailyGoals.exercise) * 100} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notificações */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notificações e Lembretes
                </CardTitle>
                <CardDescription>
                  Acompanhe seus lembretes e conquistas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma notificação ainda.</p>
                    <p className="text-sm">Continue usando o app para receber lembretes!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border ${
                          notification.read 
                            ? 'bg-gray-50 border-gray-200' 
                            : 'bg-white border-orange-200 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {notification.type === 'achievement' && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                            {notification.type === 'reminder' && (
                              <Clock className="w-5 h-5 text-blue-500" />
                            )}
                            {notification.type === 'warning' && (
                              <AlertCircle className="w-5 h-5 text-orange-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.timestamp.toLocaleString('pt-BR')}
                            </p>
                          </div>
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setNotifications(prev => 
                                  prev.map(n => 
                                    n.id === notification.id 
                                      ? { ...n, read: true }
                                      : n
                                  )
                                )
                              }}
                            >
                              Marcar como lida
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {notifications.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
                        toast.success('Todas as notificações foram marcadas como lidas!')
                      }}
                      className="w-full"
                    >
                      Marcar todas como lidas
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Configurações de notificação */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Lembretes</CardTitle>
                <CardDescription>
                  O aplicativo enviará lembretes automáticos para:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Café da manhã (8:00)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Almoço (12:00)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Jantar (19:00)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Hidratação (a cada 2 horas)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Conquistas de metas</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}