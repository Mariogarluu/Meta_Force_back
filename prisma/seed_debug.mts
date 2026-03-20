import { PrismaClient, UserStatus } from '@prisma/client'
import { hash } from 'bcrypt'
import { faker } from '@faker-js/faker'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  // Safety check: Prevent accidental execution in production
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SEEDING) {
    throw new Error('Seeding is prohibited in production environment. Set ALLOW_SEEDING=true to override (NOT RECOMMENDED).');
  }
  
  console.log('Starting to seed database with Andalucía-focused mock data...')
  
  // Clear existing data (be careful in production!)
  console.log('Clearing existing data...')
  await prisma.$transaction([
    prisma.aiChatMessage.deleteMany(),
    prisma.aiChatSession.deleteMany(),
    prisma.dietMeal.deleteMany(),
    prisma.diet.deleteMany(),
    prisma.meal.deleteMany(),
    prisma.workoutExercise.deleteMany(),
    prisma.workout.deleteMany(),
    prisma.exercise.deleteMany(),
    prisma.ticket.deleteMany(),
    prisma.classCenterSchedule.deleteMany(),
    prisma.classTrainer.deleteMany(),
    prisma.gymClass.deleteMany(),
    prisma.machine.deleteMany(),
    prisma.machineType.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.user.deleteMany(),
    prisma.center.deleteMany(),
  ])
  
  // Create Andalucía-based centers
  console.log('Creating Andalucía centers...')
  const andaluciaCities = [
    'Sevilla', 'Málaga', 'Granada', 'Córdoba', 'Cádiz', 
    'Huelva', 'Almería', 'Jaén'
  ]
  
  const centers = await prisma.center.createManyAndReturn({
    data: andaluciaCities.map((city, index) => ({
      name: `MetaForce ${city}`,
      description: `Centro deportivo de última generación en ${city}`,
      address: `Calle Deportiva ${index + 100}, ${city}`,
      city: city,
      country: 'España',
      phone: `+34 600 000 0${index + 1}`,
      email: `info${index + 1}@metaforce${city.toLowerCase()}.es`,
    }))
  })
  
  console.log(`Created ${centers.length} centers in Andalucía`)
  
  // Find Málaga center for superadmin favorite
  const malagaCenter = centers.find(c => c.name === 'MetaForce Málaga');
  if (!malagaCenter) {
    throw new Error('Málaga center not found');
  }
  
  // Create machine types
  console.log('Creating machine types...')
  const machineTypes = await prisma.machineType.createManyAndReturn({
    data: [
      { name: 'Cinta de correr', type: 'cardio' },
      { name: 'Elíptica', type: 'cardio' },
      { name: 'Bicicleta estática', type: 'cardio' },
      { name: 'Remo indoor', type: 'cardio' },
      { name: 'Press de banca', type: 'fuerza' },
      { name: 'Sentadilla guiada', type: 'fuerza' },
      { name: 'Polea alta', type: 'fuerza' },
      { name: 'Mancuernas ajustables', type: 'peso libre' },
      { name: 'Barra olímpica', type: 'peso libre' },
      { name: 'Jaula de poder', type: 'peso libre' },
      { name: 'Kettlebell', type: 'funcional' },
      { name: 'Cuerdas de batalla', type: 'funcional' },
      { name: 'Box pliométrico', type: 'funcional' },
      { name: 'TRX', type: 'funcional' },
    ]
  })
  
  console.log(`Created ${machineTypes.length} machine types`)
  
  // Create machines for each center
  console.log('Creating machines for each center...')
  const machines = []
  for (const center of centers) {
    // Create 2-4 instances of each machine type per center
    for (const type of machineTypes) {
      const instanceCount = faker.number.int({ min: 2, max: 4 })
      for (let i = 1; i <= instanceCount; i++) {
        machines.push({
          machineTypeId: type.id,
          centerId: center.id,
          instanceNumber: i,
            status: faker.helpers.weightedArrayElement([
              { value: 'operativa', weight: 80 },
              { value: 'en mantenimiento', weight: 15 },
              { value: 'fuera de servicio', weight: 5 }
            ]),
          maxUsers: faker.number.int({ min: 1, max: 3 })
        })
      }
    }
  }
  
  await prisma.machine.createMany({ data: machines })
  console.log(`Created ${machines.length} machines`)
  
  // Load and seed exercises from JSON file
  console.log('Loading exercises from JSON file...')
  const exercisesPath = 'C:/Users/mario/Desktop/Programacion/DAM/Meta-force/exercises_seed.json'
  console.log('Exercises path:', exercisesPath)
  try {
    console.log('About to read exercises file...')
    const exercisesData = JSON.parse(fs.readFileSync(exercisesPath, 'utf8'))
    console.log('Successfully read exercises file')
    
    const exercisesToCreate = exercisesData.map((exercise: any) => ({
      name: exercise.name,
      description: exercise.description,
      instructions: exercise.instructions,
    }))
    
    console.log(`Prepared ${exercisesToCreate.length} exercises for creation`)
    await prisma.exercise.createMany({
      data: exercisesToCreate,
      skipDuplicates: true,
    })
    
    console.log(`Created ${exercisesToCreate.length} exercises from JSON file`)
  } catch (error) {
    console.error('Error loading exercises:', error)
    throw error
  }
  
  // Load and seed meals from JSON file
  console.log('Loading meals from JSON file...')
  const mealsPath = 'C:/Users/mario/Desktop/Programacion/DAM/Meta-force/meals_seed.json'
  console.log('Meals path:', mealsPath)
  try {
    console.log('About to read meals file...')
    const mealsData = JSON.parse(fs.readFileSync(mealsPath, 'utf8'))
    console.log('Successfully read meals file')
    
    const mealsToCreate = mealsData.map((meal: any) => ({
      name: meal.name,
      description: meal.description,
      instructions: meal.instructions,
      calories: meal.calories || null,
      protein: meal.protein || null,
      carbs: meal.carbs || null,
      fats: meal.fats || null,
      fiber: meal.fiber || null,
    }))
    
    console.log(`Prepared ${mealsToCreate.length} meals for creation`)
    await prisma.meal.createMany({
      data: mealsToCreate,
      skipDuplicates: true,
    })
    
    console.log(`Created ${mealsToCreate.length} meals from JSON file`)
  } catch (error) {
    console.error('Error loading meals:', error)
    throw error
  }
  
  // Create superadministrators
  console.log('Creating superadministrators...')
  const superAdminPassword = await hash('StephenNigga30', 10)
  
  const superAdmins = await prisma.user.createManyAndReturn({
    data: [{
      email: 'metaforcegym@gmail.com',
      name: 'Super Admin MetaForce',
      passwordHash: superAdminPassword,
      role: 'SUPERADMIN',
      status: 'ACTIVE',
      favoriteCenterId: malagaCenter.id,
    }]
  })
  
  console.log(`Created ${superAdmins.length} superadministrators`)
  
  // No center administrators created per requirements
  
  // Create trainers with 50% verified (ACTIVE) / 50% unverified (PENDING)
  console.log('Creating trainers...')
  const trainerPassword = await hash('Trainer2026!', 10)
  
  const trainers = await prisma.user.createManyAndReturn({
    data: Array.from({ length: 15 }, (_, index) => {
      // First half verified, second half unverified
      const status = index < Math.ceil(15 / 2) ? 'ACTIVE' : 'PENDING';
      
      return {
        email: `trainer${index + 1}@metaforce.es`,
        name: faker.person.fullName(),
        passwordHash: trainerPassword,
        role: 'TRAINER',
        status: status as UserStatus,
        favoriteCenterId: faker.helpers.arrayElement(centers).id,
      };
    }),
  })
  
  console.log(`Created ${trainers.length} trainers`)
  
  // Create regular users with 50% verified (ACTIVE) / 50% unverified (PENDING), no center assignment
  console.log('Creating regular users...')
  const userPassword = await hash('User2026!', 10)
  
  const regularUsers = await prisma.user.createManyAndReturn({
    data: Array.from({ length: 50 }, (_, index) => {
      // First half verified, second half unverified
      const status = index < Math.ceil(50 / 2) ? 'ACTIVE' : 'PENDING';
      
      return {
        email: `usuario${index + 1}@test.metaforce.es`,
        name: faker.person.fullName(),
        passwordHash: userPassword,
        role: 'USER',
        status: status as UserStatus,
        centerId: null, // No center assignment per requirements
        favoriteCenterId: faker.helpers.arrayElement(centers).id,
      };
    }),
  })
  
  console.log(`Created ${regularUsers.length} regular users`)
  
  // Create gym classes
  console.log('Creating gym classes...')
  const classNames = [
    'Yoga Vinyasa', 'HIIT Intenso', 'Spinning Power', 'Zumba Fitness',
    'Pilates Clásico', 'CrossFit Básico', 'Boxeo Fitness', 'Funcional Training',
    'Body Pump', 'Gap (Glúteos, Abdominales, Piernas)', 'Stretching', 'Tai Chi',
    'Aeróbic', 'Step', 'Kombat', 'Dance Fitness'
  ]
  
  const classes = await prisma.gymClass.createManyAndReturn({
    data: classNames.map(name => ({
      name,
      description: `Clase de ${name.toLowerCase()} impartida por nuestros mejores entrenadores`,
    }))
  })
  
  console.log(`Created ${classes.length} gym classes`)
  
  // Assign trainers to classes
  console.log('Assigning trainers to classes...')
  const classTrainers = []
  for (const gymClass of classes) {
    // Assign 1-3 trainers per class
    const trainerCount = faker.number.int({ min: 1, max: 3 })
    const selectedTrainers = faker.helpers.arrayElements(trainers, trainerCount)
    
    for (const trainer of selectedTrainers) {
      classTrainers.push({
        classId: gymClass.id,
        trainerId: trainer.id,
      })
    }
  }
  
  await prisma.classTrainer.createMany({ data: classTrainers })
  console.log(`Created ${classTrainers.length} class-trainer assignments`)
  
  // Create class schedules for each center
  console.log('Creating class schedules...')
  const schedules = []
  const daysOfWeek = [1, 2, 3, 4, 5] // Lunes a Viernes
  const timeSlots = [
    { start: '07:00', end: '08:00' },
    { start: '08:00', end: '09:00' },
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' },
    { start: '12:00', end: '13:00' },
    { start: '16:00', end: '17:00' },
    { start: '17:00', end: '18:00' },
    { start: '18:00', end: '19:00' },
    { start: '19:00', end: '20:00' },
    { start: '20:00', end: '21:00' },
  ]
  
  for (const center of centers) {
    for (const gymClass of classes) {
      // Create 3-5 weekly schedules per class per center
      const scheduleCount = faker.number.int({ min: 3, max: 5 })
      for (let i = 0; i < scheduleCount; i++) {
        const day = faker.helpers.arrayElement(daysOfWeek)
        const timeSlot = faker.helpers.arrayElement(timeSlots)
        
        schedules.push({
          classId: gymClass.id,
          centerId: center.id,
          dayOfWeek: day,
          startTime: timeSlot.start,
          endTime: timeSlot.end,
        })
      }
    }
  }
  
  await prisma.classCenterSchedule.createMany({ data: schedules })
  console.log(`Created ${schedules.length} class schedules`)
  
  // Enroll users in classes (through schedules)
  console.log('Enrolling users in classes...')
  const userClassEnrollments = []
  for (const user of regularUsers) {
    // Enroll each user in 2-4 random classes
    const classCount = faker.number.int({ min: 2, max: 4 })
    const selectedClasses = faker.helpers.arrayElements(classes, classCount)
    
    for (const gymClass of selectedClasses) {
      // Find a schedule for this class at the user's center (or any center)
      const classSchedules = schedules.filter(
        s => s.classId === gymClass.id && s.centerId === user.centerId
      )
      
      if (classSchedules.length > 0) {
        userClassEnrollments.push({
          userId: user.id,
          classId: gymClass.id,
        })
      }
    }
  }
  
  // Note: Since we don't have a direct user-class relation in schema,
  // we'll need to check if there's an intermediate table or if we should
  // add enrollment through a different mechanism
  // For now, we'll skip direct enrollment since the schema shows
  // users relation on GymClass but no direct join table
  
  console.log('Seeding completed successfully!')
  
  // Display test credentials
  console.log('\n=== CREDENCIALES DE PRUEBA ===')
  console.log('Superadministradores:')
  console.log('1. Email: metaforcegym@gmail.com | Password: StephenNigga30')
  console.log('\nEntrenadores (primeros 3):')
  trainers.slice(0, 3).forEach((trainer, index) => {
    console.log(`${index + 1}. Email: ${trainer.email} | Password: Trainer2026!`)
  })
  console.log('\nUsuarios regulares (primeros 3):')
  regularUsers.slice(0, 3).forEach((user, index) => {
    console.log(`${index + 1}. Email: ${user.email} | Password: User2026!`)
  })
  console.log('\n===============================\n')
}

main()
  .catch(e => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })