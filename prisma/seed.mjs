var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { faker } from '@faker-js/faker';
var prisma = new PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var andaluciaCities, centers, machineTypes, machines, _i, centers_1, center, _a, machineTypes_1, type, instanceCount, i, superAdminPassword, superAdmins, adminPassword, centerAdmins, trainerPassword, trainers, userPassword, regularUsers, classNames, classes, classTrainers, _b, classes_1, gymClass, trainerCount, selectedTrainers, _c, selectedTrainers_1, trainer, schedules, daysOfWeek, timeSlots, _d, centers_2, center, _e, classes_2, gymClass, scheduleCount, i, day, timeSlot, userClassEnrollments, _loop_1, _f, regularUsers_1, user;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    // Safety check: Prevent accidental execution in production
                    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SEEDING) {
                        throw new Error('Seeding is prohibited in production environment. Set ALLOW_SEEDING=true to override (NOT RECOMMENDED).');
                    }
                    console.log('Starting to seed database with Andalucía-focused mock data...');
                    // Clear existing data (be careful in production!)
                    console.log('Clearing existing data...');
                    return [4 /*yield*/, prisma.$transaction([
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
                    ];
                case 1:
                    _g.sent();
                    // Create Andalucía-based centers
                    console.log('Creating Andalucía centers...');
                    andaluciaCities = [
                        'Sevilla', 'Málaga', 'Granada', 'Córdoba', 'Cádiz',
                        'Huelva', 'Almería', 'Jaén'
                    ];
                    return [4 /*yield*/, prisma.center.createManyAndReturn({
                            data: andaluciaCities.map(function (city, index) { return ({
                                name: "MetaForce ".concat(city),
                                description: "Centro deportivo de \u00FAltima generaci\u00F3n en ".concat(city),
                                address: "Calle Deportiva ".concat(index + 100, ", ").concat(city),
                                city: city,
                                country: 'España',
                                phone: "+34 600 000 0".concat(index + 1),
                                email: "info".concat(index + 1, "@metaforce").concat(city.toLowerCase(), ".es"),
                            }); })
                        })];
                case 2:
                    centers = _g.sent();
                    console.log("Created ".concat(centers.length, " centers in Andaluc\u00EDa"));
                    // Create machine types
                    console.log('Creating machine types...');
                    return [4 /*yield*/, prisma.machineType.createManyAndReturn({
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
                        })];
                case 3:
                    machineTypes = _g.sent();
                    console.log("Created ".concat(machineTypes.length, " machine types"));
                    // Create machines for each center
                    console.log('Creating machines for each center...');
                    machines = [];
                    for (_i = 0, centers_1 = centers; _i < centers_1.length; _i++) {
                        center = centers_1[_i];
                        // Create 2-4 instances of each machine type per center
                        for (_a = 0, machineTypes_1 = machineTypes; _a < machineTypes_1.length; _a++) {
                            type = machineTypes_1[_a];
                            instanceCount = faker.number.int({ min: 2, max: 4 });
                            for (i = 1; i <= instanceCount; i++) {
                                machines.push({
                                    machineTypeId: type.id,
                                    centerId: center.id,
                                    instanceNumber: i,
                                    status: faker.helpers.weightedArrayElement([
                                        { value: 'operativa', weight: 80 },
                                        { value: 'en mantenimiento', weight: 15 },
                                        { value: 'fuera de servicio', weight: 5 }
                                    ])[0].value,
                                    maxUsers: faker.number.int({ min: 1, max: 3 })
                                });
                            }
                        }
                    }
                    return [4 /*yield*/, prisma.machine.createMany({ data: machines })];
                case 4:
                    _g.sent();
                    console.log("Created ".concat(machines.length, " machines"));
                    // Create superadministrators
                    console.log('Creating superadministrators...');
                    return [4 /*yield*/, hash('AdminMetaForce2026!', 10)];
                case 5:
                    superAdminPassword = _g.sent();
                    return [4 /*yield*/, prisma.user.createManyAndReturn({
                            data: [
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
                        })];
                case 6:
                    superAdmins = _g.sent();
                    console.log("Created ".concat(superAdmins.length, " superadministrators"));
                    // Create center administrators (ADMIN_CENTER)
                    console.log('Creating center administrators...');
                    return [4 /*yield*/, hash('AdminCenter2026!', 10)];
                case 7:
                    adminPassword = _g.sent();
                    return [4 /*yield*/, prisma.user.createManyAndReturn({
                            data: centers.map(function (center, index) { return ({
                                email: "admin".concat(index + 1, "@").concat(center.name.toLowerCase().replace(/\s/g, ''), ".es"),
                                name: faker.person.fullName({ firstName: 'Admin', lastName: "Centro".concat(index + 1) }),
                                passwordHash: adminPassword,
                                role: 'ADMIN_CENTER',
                                status: 'ACTIVE',
                                centerId: center.id,
                                favoriteCenterId: center.id,
                            }); })
                        })];
                case 8:
                    centerAdmins = _g.sent();
                    console.log("Created ".concat(centerAdmins.length, " center administrators"));
                    // Create trainers
                    console.log('Creating trainers...');
                    return [4 /*yield*/, hash('Trainer2026!', 10)];
                case 9:
                    trainerPassword = _g.sent();
                    return [4 /*yield*/, prisma.user.createManyAndReturn({
                            data: Array.from({ length: 15 }, function (_, index) { return ({
                                email: "trainer".concat(index + 1, "@metaforce.es"),
                                name: faker.person.fullName(),
                                passwordHash: trainerPassword,
                                role: 'TRAINER',
                                status: faker.helpers.weightedArrayElement([
                                    { value: 'ACTIVE', weight: 85 },
                                    { value: 'INACTIVE', weight: 10 },
                                    { value: 'PENDING', weight: 5 }
                                ])[0].value,
                                favoriteCenterId: faker.helpers.arrayElement(centers).id,
                            }); })
                        })];
                case 10:
                    trainers = _g.sent();
                    console.log("Created ".concat(trainers.length, " trainers"));
                    // Create regular users
                    console.log('Creating regular users...');
                    return [4 /*yield*/, hash('User2026!', 10)];
                case 11:
                    userPassword = _g.sent();
                    return [4 /*yield*/, prisma.user.createManyAndReturn({
                            data: Array.from({ length: 50 }, function (_, index) { return ({
                                email: "usuario".concat(index + 1, "@test.metaforce.es"),
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
                            }); })
                        })];
                case 12:
                    regularUsers = _g.sent();
                    console.log("Created ".concat(regularUsers.length, " regular users"));
                    // Create gym classes
                    console.log('Creating gym classes...');
                    classNames = [
                        'Yoga Vinyasa', 'HIIT Intenso', 'Spinning Power', 'Zumba Fitness',
                        'Pilates Clásico', 'CrossFit Básico', 'Boxeo Fitness', 'Funcional Training',
                        'Body Pump', 'Gap (Glúteos, Abdominales, Piernas)', 'Stretching', 'Tai Chi',
                        'Aeróbic', 'Step', 'Kombat', 'Dance Fitness'
                    ];
                    return [4 /*yield*/, prisma.gymClass.createManyAndReturn({
                            data: classNames.map(function (name) { return ({
                                name: name,
                                description: "Clase de ".concat(name.toLowerCase(), " impartida por nuestros mejores entrenadores"),
                            }); })
                        })];
                case 13:
                    classes = _g.sent();
                    console.log("Created ".concat(classes.length, " gym classes"));
                    // Assign trainers to classes
                    console.log('Assigning trainers to classes...');
                    classTrainers = [];
                    for (_b = 0, classes_1 = classes; _b < classes_1.length; _b++) {
                        gymClass = classes_1[_b];
                        trainerCount = faker.number.int({ min: 1, max: 3 });
                        selectedTrainers = faker.helpers.arrayElements(trainers, trainerCount);
                        for (_c = 0, selectedTrainers_1 = selectedTrainers; _c < selectedTrainers_1.length; _c++) {
                            trainer = selectedTrainers_1[_c];
                            classTrainers.push({
                                classId: gymClass.id,
                                trainerId: trainer.id,
                            });
                        }
                    }
                    return [4 /*yield*/, prisma.classTrainer.createMany({ data: classTrainers })];
                case 14:
                    _g.sent();
                    console.log("Created ".concat(classTrainers.length, " class-trainer assignments"));
                    // Create class schedules for each center
                    console.log('Creating class schedules...');
                    schedules = [];
                    daysOfWeek = [1, 2, 3, 4, 5] // Lunes a Viernes
                    ;
                    timeSlots = [
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
                    ];
                    for (_d = 0, centers_2 = centers; _d < centers_2.length; _d++) {
                        center = centers_2[_d];
                        for (_e = 0, classes_2 = classes; _e < classes_2.length; _e++) {
                            gymClass = classes_2[_e];
                            scheduleCount = faker.number.int({ min: 3, max: 5 });
                            for (i = 0; i < scheduleCount; i++) {
                                day = faker.helpers.arrayElement(daysOfWeek);
                                timeSlot = faker.helpers.arrayElement(timeSlots);
                                schedules.push({
                                    classId: gymClass.id,
                                    centerId: center.id,
                                    dayOfWeek: day,
                                    startTime: timeSlot.start,
                                    endTime: timeSlot.end,
                                });
                            }
                        }
                    }
                    return [4 /*yield*/, prisma.classCenterSchedule.createMany({ data: schedules })];
                case 15:
                    _g.sent();
                    console.log("Created ".concat(schedules.length, " class schedules"));
                    // Enroll users in classes (through schedules)
                    console.log('Enrolling users in classes...');
                    userClassEnrollments = [];
                    _loop_1 = function (user) {
                        // Enroll each user in 2-4 random classes
                        var classCount = faker.number.int({ min: 2, max: 4 });
                        var selectedClasses = faker.helpers.arrayElements(classes, classCount);
                        var _loop_2 = function (gymClass) {
                            // Find a schedule for this class at the user's center (or any center)
                            var classSchedules = schedules.filter(function (s) { return s.classId === gymClass.id && s.centerId === user.centerId; });
                            if (classSchedules.length > 0) {
                                userClassEnrollments.push({
                                    userId: user.id,
                                    classId: gymClass.id,
                                });
                            }
                        };
                        for (var _h = 0, selectedClasses_1 = selectedClasses; _h < selectedClasses_1.length; _h++) {
                            var gymClass = selectedClasses_1[_h];
                            _loop_2(gymClass);
                        }
                    };
                    for (_f = 0, regularUsers_1 = regularUsers; _f < regularUsers_1.length; _f++) {
                        user = regularUsers_1[_f];
                        _loop_1(user);
                    }
                    // Note: Since we don't have a direct user-class relation in schema,
                    // we'll need to check if there's an intermediate table or if we should
                    // add enrollment through a different mechanism
                    // For now, we'll skip direct enrollment since the schema shows
                    // users relation on GymClass but no direct join table
                    console.log('Seeding completed successfully!');
                    // Display test credentials
                    console.log('\n=== CREDENCIALES DE PRUEBA ===');
                    console.log('Superadministradores:');
                    console.log('1. Email: superadmin1@metaforce.es | Password: AdminMetaForce2026!');
                    console.log('2. Email: superadmin2@metaforce.es | Password: AdminMetaForce2026!');
                    console.log('\nAdministradores de centros:');
                    centerAdmins.forEach(function (admin, index) {
                        console.log("".concat(index + 1, ". Email: ").concat(admin.email, " | Password: AdminCenter2026!"));
                    });
                    console.log('\nEntrenadores (primeros 3):');
                    trainers.slice(0, 3).forEach(function (trainer, index) {
                        console.log("".concat(index + 1, ". Email: ").concat(trainer.email, " | Password: Trainer2026!"));
                    });
                    console.log('\nUsuarios regulares (primeros 3):');
                    regularUsers.slice(0, 3).forEach(function (user, index) {
                        console.log("".concat(index + 1, ". Email: ").concat(user.email, " | Password: User2026!"));
                    });
                    console.log('\n===============================\n');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('Error during seeding:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
