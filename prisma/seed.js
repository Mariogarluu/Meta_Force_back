import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

async function main() {
  // Safety check: Prevent accidental execution in production
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SEEDING) {
    throw new Error('Seeding is prohibited in production environment. Set ALLOW_SEEDING=true to override (NOT RECOMMENDED).');
  }
  
  console.log('Starting to seed database with Andalucía-focused mock data...')
  
  // We will attempt to create data, and if there are errors (like unique constraints), we will skip and continue.
  
  // Create Andalucía-based centers
  console.log('Creating Andalucía centers...')
  const andaluciaCities = [
    'Sevilla', 'Málaga', 'Granada', 'Córdoba', 'Cádiz', 
    'Huelva', 'Almería', 'Jaén'
  ]
  
  for (const city of andaluciaCities) {
    try {
      await prisma.center.create({
        data: {
          name: `MetaForce ${city}`,
          description: `Centro deportivo de última generación en ${city}`,
          address: `Calle Deportiva ${Math.floor(Math.random() * 1000) + 100}, ${city}`,
          city: city,
          country: 'España',
          phone: `+34 600 000 0${Math.floor(Math.random() * 10)}`,
          email: `info${city.toLowerCase()}@metaforce${city.toLowerCase()}.es`,
        }
      })
      console.log(`Created center: MetaForce ${city}`)
    } catch (error) {
      // If it's a unique constraint error, we can ignore and assume it already exists
      if (error.code === 'P2002') {
        console.log(`Center MetaForce ${city} already exists, skipping.`)
      } else {
        console.error(`Error creating center MetaForce ${city}:`, error.message)
      }
    }
  }
  
  // Fetch all centers to use in subsequent steps
  let centers = []
  try {
    centers = await prisma.center.findMany({
      where: {
        name: {
          in: andaluciaCities.map(city => `MetaForce ${city}`)
        }
      }
    })
    console.log(`Found ${centers.length} centers in Andalucía`)
  } catch (error) {
    console.error('Error fetching centers:', error.message)
    // If we can't fetch, we cannot proceed meaningfully
    throw new Error('Cannot fetch centers. Aborting seeding.')
  }
  
  if (centers.length === 0) {
    throw new Error('No centers found. Cannot proceed with seeding.')
  }
  
  // Create machine types
  console.log('Creating machine types...')
  const machineTypesData = [
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
  
  for (const typeData of machineTypesData) {
    try {
      await prisma.machineType.create({
        data: typeData
      })
      console.log(`Created machine type: ${typeData.name}`)
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`Machine type ${typeData.name} already exists, skipping.`)
      } else {
        console.error(`Error creating machine type ${typeData.name}:`, error.message)
      }
    }
  }
  
  // Fetch all machine types
  let machineTypes = []
  try {
    machineTypes = await prisma.machineType.findMany()
    console.log(`Found ${machineTypes.length} machine types`)
  } catch (error) {
    console.error('Error fetching machine types:', error.message)
    // We can continue without machine types, but machines will fail
  }
  
  // Create machines for each center
  console.log('Creating machines for each center...')
  for (const center of centers) {
    for (const type of machineTypes) {
      const instanceCount = faker.number.int({ min: 2, max: 4 })
      for (let i = 1; i <= instanceCount; i++) {
        try {
          await prisma.machine.create({
            data: {
              machineTypeId: type.id,
              centerId: center.id,
              instanceNumber: i,
              status: faker.helpers.weightedArrayElement([
                { value: 'operativa', weight: 80 },
                { value: 'en mantenimiento', weight: 15 },
                { value: 'fuera de servicio', weight: 5 }
              ])[0].value,
              maxUsers: faker.number.int({ min: 1, max: 3 })
            }
          })
        } catch (error) {
          if (error.code === 'P2002') {
            // Unique constraint on machineTypeId, centerId, instanceNumber
            // We can skip this specific instance
          } else {
            console.error(`Error creating machine for center ${center.name}, type ${type.name}, instance ${i}:`, error.message)
          }
        }
      }
    }
  }
  console.log('Finished creating machines (skipped duplicates)')
  
  // Create superadministrators
  console.log('Creating superadministrators...')
  const superAdminPassword = await bcrypt.hash('AdminMetaForce2026!', 10)
  
  const superAdminsData = [
    {
      email: 'superadmin1@metaforce.es',
      name: 'Carlos Martín López',
      passwordHash: superAdminPassword,
      role: 'SUPERADMIN',
      status: 'ACTIVE',
      favoriteCenterId: centers[0].id, // Sevilla
    },
    {
      email: 'superadmin2@metaforce.es',
      name: 'María García Rodríguez',
      passwordHash: superAdminPassword,
      role: 'SUPERADMIN',
      status: 'ACTIVE',
      favoriteCenterId: centers[1].id, // Málaga
    }
  ]
  
  for (const adminData of superAdminsData) {
    try {
      await prisma.user.create({
        data: adminData
      })
      console.log(`Created superadmin: ${adminData.email}`)
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`Superadmin ${adminData.email} already exists, skipping.`)
      } else {
        console.error(`Error creating superadmin ${adminData.email}:`, error.message)
      }
    }
  }
  
  // Create center administrators (ADMIN_CENTER)
  console.log('Creating center administrators...')
  const adminPassword = await bcrypt.hash('AdminCenter2026!', 10)
  
  for (const center of centers) {
    const adminData = {
      email: `admin${centers.indexOf(center) + 1}@${center.name.toLowerCase().replace(/\s/g, '')}.es`,
      name: faker.person.fullName({ firstName: 'Admin', lastName: `Centro${centers.indexOf(center) + 1}` }),
      passwordHash: adminPassword,
      role: 'ADMIN_CENTER',
      status: 'ACTIVE',
      centerId: center.id,
      favoriteCenterId: center.id,
    }
    try {
      await prisma.user.create({
        data: adminData
      })
      console.log(`Created admin for center ${center.name}`)
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`Admin for center ${center.name} already exists, skipping.`)
      } else {
        console.error(`Error creating admin for center ${center.name}:`, error.message)
      }
    }
  }
  
  // Create trainers
  console.log('Creating trainers...')
  const trainerPassword = await bcrypt.hash('Trainer2026!', 10)
  
  for (let i = 0; i < 15; i++) {
    const trainerData = {
      email: `trainer${i + 1}@metaforce.es`,
      name: faker.person.fullName(),
      passwordHash: trainerPassword,
      role: 'TRAINER',
      status: faker.helpers.weightedArrayElement([
        { value: 'ACTIVE', weight: 85 },
        { value: 'INACTIVE', weight: 10 },
        { value: 'PENDING', weight: 5 }
      ])[0].value,
      favoriteCenterId: faker.helpers.arrayElement(centers).id,
    }
    try {
      await prisma.user.create({
        data: trainerData
      })
    } catch (error) {
      if (error.code === 'P2002') {
        // Skip duplicate email
      } else {
        console.error(`Error creating trainer ${trainerData.email}:`, error.message)
      }
    }
  }
  console.log('Finished creating trainers (skipped duplicates)')
  
  // Create regular users
  console.log('Creating regular users...')
  const userPassword = await bcrypt.hash('User2026!', 10)
  
  for (let i = 0; i < 50; i++) {
    const userData = {
      email: `usuario${i + 1}@test.metaforce.es`,
      name: faker.person.fullName(),
      passwordHash: userPassword,
      role: 'USER',
      status: faker.helpers.weightedArrayElement([
        { value: 'ACTIVE', weight: 70 },
        { value: 'PENDING', weight: 20 },
        { value: 'INACTIVE', weight: 10 }
      ])[0].value,
      centerId: faker.helpers.arrayElement(centers).id,
      favoriteCenterId: faker.helpers.arrayElement(centers).id,
    }
    try {
      await prisma.user.create({
        data: userData
      })
    } catch (error) {
      if (error.code === 'P2002') {
        // Skip duplicate email
      } else {
        console.error(`Error creating regular user ${userData.email}:`, error.message)
      }
    }
  }
  console.log('Finished creating regular users (skipped duplicates)')
  
  // Create gym classes
  console.log('Creating gym classes...')
  const classNames = [
    'Yoga Vinyasa', 'HIIT Intenso', 'Spinning Power', 'Zumba Fitness',
    'Pilates Clásico', 'CrossFit Básico', 'Boxeo Fitness', 'Funcional Training',
    'Body Pump', 'Gap (Glúteos, Abdominales, Piernas)', 'Stretching', 'Tai Chi',
    'Aeróbic', 'Step', 'Kombat', 'Dance Fitness'
  ]
  
  for (const className of classNames) {
    try {
      await prisma.gymClass.create({
        data: {
          name: className,
          description: `Clase de ${className.toLowerCase()} impartida por nuestros mejores entrenadores`,
        }
      })
      console.log(`Created gym class: ${className}`)
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`Gym class ${className} already exists, skipping.`)
      } else {
        console.error(`Error creating gym class ${className}:`, error.message)
      }
    }
  }
  
  // Fetch all classes
  let classes = []
  try {
    classes = await prisma.gymClass.findMany()
    console.log(`Found ${classes.length} gym classes`)
  } catch (error) {
    console.error('Error fetching gym classes:', error.message)
  }
  
  // Assign trainers to classes
  console.log('Assigning trainers to classes...')
  for (const gymClass of classes) {
    const trainerCount = faker.number.int({ min: 1, max: 3 })
    const selectedTrainers = faker.helpers.arrayElements(await prisma.user.findMany({ where: { role: 'TRAINER' } }), trainerCount)
    
    for (const trainer of selectedTrainers) {
      try {
        await prisma.classTrainer.create({
          data: {
            classId: gymClass.id,
            trainerId: trainer.id,
          }
        })
      } catch (error) {
        if (error.code === 'P2002') {
          // Already assigned
        } else {
          console.error(`Error assigning trainer ${trainer.id} to class ${gymClass.id}:`, error.message)
        }
      }
    }
  }
  console.log('Finished assigning trainers to classes (skipped duplicates)')
  
  // Create class schedules for each center
  console.log('Creating class schedules...')
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
      const scheduleCount = faker.number.int({ min: 3, max: 5 })
      for (let i = 0; i < scheduleCount; i++) {
        const day = faker.helpers.arrayElement(daysOfWeek)
        const timeSlot = faker.helpers.arrayElement(timeSlots)
        
        try {
          await prisma.classCenterSchedule.create({
            data: {
              classId: gymClass.id,
              centerId: center.id,
              dayOfWeek: day,
              startTime: timeSlot.start,
              endTime: timeSlot.end,
            }
          })
        } catch (error) {
          if (error.code === 'P2002') {
            // Already exists for this class, center, dayOfWeek
          } else {
            console.error(`Error creating class schedule for class ${gymClass.name}, center ${center.name}, day ${day}:`, error.message)
          }
        }
      }
    }
  }
  console.log('Finished creating class schedules (skipped duplicates)')
  
  console.log('Seeding completed successfully!')
  
  // Display test credentials
  console.log('\n=== CREDENCIALES DE PRUEBA ===')
  console.log('Superadministradores:')
  console.log('1. Email: superadmin1@metaforce.es | Password: AdminMetaForce2026!')
  console.log('2. Email: superadmin2@metaforce.es | Password: AdminMetaForce2026!')
  console.log('\nAdministradores de centros:')
  for (let i = 0; i < centers.length; i++) {
    const center = centers[i]
    console.log(`${i + 1}. Email: admin${i + 1}@${center.name.toLowerCase().replace(/\s/g, '')}.es | Password: AdminCenter2026!`)
  }
  console.log('\nEntrenadores (primeros 3):')
  const trainers = await prisma.user.findMany({ where: { role: 'TRAINER' }, take: 3 })
  trainers.forEach((trainer, index) => {
    console.log(`${index + 1}. Email: ${trainer.email} | Password: Trainer2026!`)
  })
  console.log('\nUsuarios regulares (primeros 3):')
  const regularUsers = await prisma.user.findMany({ where: { role: 'USER' }, take: 3 })
  regularUsers.forEach((user, index) => {
    console.log(`${index + 1}. Email: ${user.email} | Password: User2026!`)
  })
  console.log('\n===============================\n')
}

// Execute main function if script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .catch(e => {
      console.error('Error during seeding:', e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export default main