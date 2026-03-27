// apps/api/src/seed.ts
// Exécuter avec : npx ts-node src/seed.ts
// Crée les plans SaaS + le compte SUPER_ADMIN initial

// ⚠️ Charger le .env AVANT tout import TypeORM
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { SubscriptionPlanEntity } from './plans/entities/subscription-plan.entity';
import { SubscriptionEntity } from './plans/entities/subscription.entity';
import { UserEntity } from './auth/entities/user.entity';
import { CompanyEntity } from './companies/entities/company.entity';
import { CompanySettingsEntity } from './companies/entities/company-settings.entity';
import { RouteEntity } from './routes/entities/route.entity';
import { RouteStopEntity } from './routes/entities/route-stop.entity';
import { SegmentPriceEntity } from './routes/entities/segment-price.entity';
import { UserRole } from './shared/types';
import { BusEntity, BusStatus, BusType } from './buses/entities/bus.entity';
import { TripEntity } from './trips/entities/trip.entity';
import { ScheduleEntity, ScheduleStatus } from './schedules/entities/schedule.entity';
import { AgencyEntity } from './agencies/entities/agency.entity';


const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'fasossira',
  password: process.env.DB_PASS || 'fasossira_dev',
  database: process.env.DB_NAME || 'fasossira',
  entities: [
    CompanyEntity, CompanySettingsEntity,
    SubscriptionPlanEntity, SubscriptionEntity,
    UserEntity,
    RouteEntity, RouteStopEntity, SegmentPriceEntity,
    BusEntity,
    TripEntity,
    ScheduleEntity,
    AgencyEntity,   // ← Étape 5 : requis car UserEntity#agency référence AgencyEntity
  ],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('✅ Connexion DB établie');

  const planRepo = AppDataSource.getRepository(SubscriptionPlanEntity);
  const userRepo = AppDataSource.getRepository(UserEntity);

  // ─── Plans SaaS ─────────────────────────────────────────────
  const plans = [
    {
      name: 'Starter',
      price: 25000,       // 25 000 FCFA/mois
      maxBuses: 5,
      maxAgencies: 2,
      maxUsers: 10,
      features: ['Vente guichet', 'Vente en route', 'Tickets QR', 'Dashboard basique'],
    },
    {
      name: 'Pro',
      price: 75000,       // 75 000 FCFA/mois
      maxBuses: 20,
      maxAgencies: 10,
      maxUsers: 50,
      features: ['Tout Starter', 'Rapports avancés', 'Multi-agences', 'Branding white-label', 'Export PDF'],
    },
    {
      name: 'Enterprise',
      price: 150000,      // 150 000 FCFA/mois
      maxBuses: -1,       // Illimité
      maxAgencies: -1,
      maxUsers: -1,
      features: ['Tout Pro', 'API accès', 'Support dédié', 'SLA garanti', 'Domaine personnalisé'],
    },
  ];

  for (const plan of plans) {
    const existing = await planRepo.findOne({ where: { name: plan.name } });
    if (!existing) {
      await planRepo.save(planRepo.create(plan));
      console.log(`✅ Plan créé : ${plan.name}`);
    } else {
      console.log(`⏭  Plan existant : ${plan.name}`);
    }
  }

  // ─── Super Admin ─────────────────────────────────────────────
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@fasossira.com';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin2026!';

  const existing = await userRepo.findOne({ where: { email: superAdminEmail } });
  if (!existing) {
    const hash = await bcrypt.hash(superAdminPassword, 10);
    await userRepo.save(userRepo.create({
      name: 'Super Administrateur',
      email: superAdminEmail,
      password: hash,
      role: UserRole.SUPER_ADMIN,
      companyId: null,
      isActive: true,
    }));
    console.log(`✅ Super Admin créé : ${superAdminEmail}`);
    console.log(`   Mot de passe : ${superAdminPassword}`);
    console.log('   ⚠️  Changer ce mot de passe immédiatement en production !');
  } else {
    console.log(`⏭  Super Admin existant : ${superAdminEmail}`);
  }

  // ─── Tenant de démo (Sotrama Bamako) ─────────────────────────
  if (process.env.SEED_DEMO === 'true') {
    const companyRepo = AppDataSource.getRepository(CompanyEntity);
    const settingsRepo = AppDataSource.getRepository(CompanySettingsEntity);

    let demoCompany = await companyRepo.findOne({ where: { slug: 'sotrama-bamako' } });
    if (!demoCompany) {
      demoCompany = await companyRepo.save(companyRepo.create({
        name: 'Sotrama Bamako',
        slug: 'sotrama-bamako',
        city: 'Bamako',
        phone: '+223 20 22 33 44',
        isActive: true,
      }));
      await settingsRepo.save(settingsRepo.create({
        companyId: demoCompany.id,
        companyDisplayName: 'Sotrama Bamako',
        primaryColor: '#0B3D91',
        secondaryColor: '#E63B2E',
        ticketFooter: 'Sotrama Bamako — Votre sécurité est notre priorité | +223 20 22 33 44',
        supportContact: '+223 20 22 33 44',
      }));
      // ── Agences de démo ──────────────────────────────────────
      const agencyRepo = AppDataSource.getRepository(AgencyEntity);

      const agencyCentrale = await agencyRepo.save(agencyRepo.create({
        companyId: demoCompany.id,
        name: 'Agence Centrale Bamako',
        city: 'Bamako',
        address: 'Avenue de la République, Commune III',
        phone: '+223 20 22 11 00',
        managerName: 'Koné Traoré',
        isActive: true,
      }));

      const agencySogoniko = await agencyRepo.save(agencyRepo.create({
        companyId: demoCompany.id,
        name: 'Agence Sogoniko',
        city: 'Bamako',
        address: 'Route de Ségou, Sogoniko',
        phone: '+223 76 55 44 33',
        managerName: 'Fatoumata Diarra',
        isActive: true,
      }));

      const agencySegou = await agencyRepo.save(agencyRepo.create({
        companyId: demoCompany.id,
        name: 'Agence Ségou',
        city: 'Ségou',
        address: 'Quartier Commercial, Ségou',
        phone: '+223 75 33 22 11',
        managerName: 'Ibrahim Coulibaly',
        isActive: true,
      }));

      console.log('✅ 3 agences créées');

      // ── Utilisateurs de démo (liés aux agences) ──────────────
      // Admin principal — sans agence (accès global)
      const adminHash = await bcrypt.hash('Demo2026!', 10);
      await userRepo.save(userRepo.create({
        companyId: demoCompany.id,
        name: 'Koné Traoré',
        email: 'admin@sotrama-bamako.ml',
        password: adminHash,
        role: UserRole.ADMIN,
        agencyId: null,   // Admin global — pas rattaché à une agence
        isActive: true,
      }));

      // Agent agence centrale
      const agentHash = await bcrypt.hash('Agent2026!', 10);
      await userRepo.save(userRepo.create({
        companyId: demoCompany.id,
        name: 'Aminata Coulibaly',
        email: 'agent@sotrama-bamako.ml',
        password: agentHash,
        role: UserRole.AGENT,
        agencyId: agencyCentrale.id,
        isActive: true,
      }));

      // Agent agence Sogoniko
      const agent2Hash = await bcrypt.hash('Agent2026!', 10);
      await userRepo.save(userRepo.create({
        companyId: demoCompany.id,
        name: 'Moussa Keïta',
        email: 'agent.sogoniko@sotrama-bamako.ml',
        password: agent2Hash,
        role: UserRole.AGENT,
        agencyId: agencySogoniko.id,
        isActive: true,
      }));

      // Agent agence Ségou
      const agent3Hash = await bcrypt.hash('Agent2026!', 10);
      await userRepo.save(userRepo.create({
        companyId: demoCompany.id,
        name: 'Ibrahim Coulibaly',
        email: 'agent.segou@sotrama-bamako.ml',
        password: agent3Hash,
        role: UserRole.AGENT,
        agencyId: agencySegou.id,
        isActive: true,
      }));

      console.log('✅ Tenant démo créé : Sotrama Bamako');
      console.log('   Admin     : admin@sotrama-bamako.ml / Demo2026! (sans agence)');
      console.log('   Agent 1   : agent@sotrama-bamako.ml / Agent2026! (Agence Centrale)');
      console.log('   Agent 2   : agent.sogoniko@sotrama-bamako.ml / Agent2026! (Sogoniko)');
      console.log('   Agent 3   : agent.segou@sotrama-bamako.ml / Agent2026! (Ségou)');
    }

    // ─── Routes de démonstration ──────────────────────────────
    // Seed uniquement si demoCompany existe et pas encore de routes
    if (demoCompany) {
      const routeRepo = AppDataSource.getRepository(RouteEntity);
      const stopRepo = AppDataSource.getRepository(RouteStopEntity);
      const priceRepo = AppDataSource.getRepository(SegmentPriceEntity);

      const existingRoutes = await routeRepo.count({ where: { companyId: demoCompany.id } });

      if (existingRoutes === 0) {
        // ── Route 1 : Bamako → Ségou → San → Mopti ─────────────
        const route1 = await routeRepo.save(routeRepo.create({
          companyId: demoCompany.id,
          name: 'Bamako → Mopti',
          description: 'Route principale — Axe Nord Mali',
          isActive: true,
        }));

        // Arrêts ordonnés
        const stops1 = [
          { cityName: 'Bamako', order: 1, distanceFromStart: 0 },
          { cityName: 'Ségou', order: 2, distanceFromStart: 235 },
          { cityName: 'San', order: 3, distanceFromStart: 385 },
          { cityName: 'Mopti', order: 4, distanceFromStart: 620 },
        ];
        for (const s of stops1) {
          await stopRepo.save(stopRepo.create({ ...s, companyId: demoCompany.id, routeId: route1.id }));
        }

        // Grille de prix segments (tous les segments A→B possibles)
        // Prix réels du marché Mali (FCFA)
        const prices1 = [
          { fromStopOrder: 1, toStopOrder: 2, price: 4500 }, // Bamako → Ségou
          { fromStopOrder: 1, toStopOrder: 3, price: 7000 }, // Bamako → San
          { fromStopOrder: 1, toStopOrder: 4, price: 8500 }, // Bamako → Mopti
          { fromStopOrder: 2, toStopOrder: 3, price: 3000 }, // Ségou  → San
          { fromStopOrder: 2, toStopOrder: 4, price: 5000 }, // Ségou  → Mopti
          { fromStopOrder: 3, toStopOrder: 4, price: 2500 }, // San    → Mopti
        ];
        for (const p of prices1) {
          await priceRepo.save(priceRepo.create({ ...p, companyId: demoCompany.id, routeId: route1.id, currency: 'XOF' }));
        }
        console.log('✅ Route 1 créée : Bamako → Ségou → San → Mopti (6 prix segments)');

        // ── Route 2 : Bamako → Sikasso ───────────────────────────
        const route2 = await routeRepo.save(routeRepo.create({
          companyId: demoCompany.id,
          name: 'Bamako → Sikasso',
          description: 'Route Sud Mali',
          isActive: true,
        }));
        const stops2 = [
          { cityName: 'Bamako', order: 1, distanceFromStart: 0 },
          { cityName: 'Bougouni', order: 2, distanceFromStart: 165 },
          { cityName: 'Sikasso', order: 3, distanceFromStart: 370 },
        ];
        for (const s of stops2) {
          await stopRepo.save(stopRepo.create({ ...s, companyId: demoCompany.id, routeId: route2.id }));
        }
        const prices2 = [
          { fromStopOrder: 1, toStopOrder: 2, price: 3500 }, // Bamako   → Bougouni
          { fromStopOrder: 1, toStopOrder: 3, price: 6000 }, // Bamako   → Sikasso
          { fromStopOrder: 2, toStopOrder: 3, price: 3000 }, // Bougouni → Sikasso
        ];
        for (const p of prices2) {
          await priceRepo.save(priceRepo.create({ ...p, companyId: demoCompany.id, routeId: route2.id, currency: 'XOF' }));
        }
        console.log('✅ Route 2 créée : Bamako → Bougouni → Sikasso (3 prix segments)');
      } else {
        console.log(`⏭  Routes déjà existantes (${existingRoutes} routes)`);
      }
      // ─── Flotte & Voyages (Étape 3) ──────────────────────────
      const busRepo = AppDataSource.getRepository(BusEntity);
      const tripRepo = AppDataSource.getRepository(TripEntity);
      const scheduleRepo = AppDataSource.getRepository(ScheduleEntity);

      const existingBuses = await busRepo.count({ where: { companyId: demoCompany.id } });

      if (existingBuses === 0) {

        // ── Bus ──────────────────────────────────────────────────
        const bus1 = await busRepo.save(busRepo.create({
          companyId: demoCompany.id,
          plate: 'BA-1001-ML',
          brand: 'Toyota',
          model: 'Coaster',
          capacity: 30,
          type: BusType.COASTER,
          status: BusStatus.ACTIVE,
        }));
        const bus2 = await busRepo.save(busRepo.create({
          companyId: demoCompany.id,
          plate: 'BA-1002-ML',
          brand: 'Mercedes',
          model: 'Sprinter',
          capacity: 20,
          type: BusType.SPRINTER,
          status: BusStatus.ACTIVE,
        }));
        const bus3 = await busRepo.save(busRepo.create({
          companyId: demoCompany.id,
          plate: 'BA-1003-ML',
          brand: 'Scania',
          model: 'Touring',
          capacity: 60,
          type: BusType.GRAND_BUS,
          status: BusStatus.ACTIVE,
        }));
        // Bus en maintenance — pour tester les cas d'erreur
        await busRepo.save(busRepo.create({
          companyId: demoCompany.id,
          plate: 'BA-1004-ML',
          brand: 'Toyota',
          model: 'Coaster',
          capacity: 30,
          type: BusType.COASTER,
          status: BusStatus.MAINTENANCE,
        }));
        console.log('✅ 4 bus créés (3 actifs, 1 en maintenance)');

        // ── Trips (modèles de voyage réutilisables) ──────────────
        // Récupérer les routes déjà seedées
        const route1 = await routeRepo.findOne({
          where: { companyId: demoCompany.id, name: 'Bamako → Mopti' },
        });
        const route2 = await routeRepo.findOne({
          where: { companyId: demoCompany.id, name: 'Bamako → Sikasso' },
        });

        // Trip 1 : Bamako → Mopti départ matin
        const trip1 = await tripRepo.save(tripRepo.create({
          companyId: demoCompany.id,
          routeId: route1!.id,
          departureTime: '06:00',
          arrivalTime: '14:00',
          isActive: true,
        }));
        // Trip 2 : Bamako → Mopti départ après-midi
        const trip2 = await tripRepo.save(tripRepo.create({
          companyId: demoCompany.id,
          routeId: route1!.id,
          departureTime: '13:00',
          arrivalTime: '21:00',
          isActive: true,
        }));
        // Trip 3 : Bamako → Sikasso matin
        const trip3 = await tripRepo.save(tripRepo.create({
          companyId: demoCompany.id,
          routeId: route2!.id,
          departureTime: '07:00',
          arrivalTime: '13:00',
          isActive: true,
        }));
        console.log('✅ 3 trips créés');

        // ── Schedules (instances à des dates précises) ────────────
        // Dates dans le futur proche pour pouvoir tester
        const today = new Date();
        const d = (offsetDays: number) => {
          const date = new Date(today);
          date.setDate(today.getDate() + offsetDays);
          return date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
        };

        // ── Helper : combine date 'YYYY-MM-DD' + time 'HH:mm' → Date ──
        const buildDateTime = (date: string, time: string): Date => {
          return new Date(`${date}T${time}:00.000Z`);
        };

        // ── Schedules ─────────────────────────────────────────────────
        const scheduleDefs = [
          { tripId: trip1.id, busId: bus1.id, bus: bus1, date: d(1), trip: trip1, status: ScheduleStatus.SCHEDULED },
          { tripId: trip1.id, busId: bus1.id, bus: bus1, date: d(3), trip: trip1, status: ScheduleStatus.SCHEDULED },
          { tripId: trip1.id, busId: bus1.id, bus: bus1, date: d(5), trip: trip1, status: ScheduleStatus.SCHEDULED },
          { tripId: trip2.id, busId: bus3.id, bus: bus3, date: d(1), trip: trip2, status: ScheduleStatus.SCHEDULED },
          { tripId: trip2.id, busId: bus3.id, bus: bus3, date: d(4), trip: trip2, status: ScheduleStatus.SCHEDULED },
          { tripId: trip3.id, busId: bus2.id, bus: bus2, date: d(2), trip: trip3, status: ScheduleStatus.SCHEDULED },
          { tripId: trip3.id, busId: bus2.id, bus: bus2, date: d(6), trip: trip3, status: ScheduleStatus.SCHEDULED },
          { tripId: trip1.id, busId: bus1.id, bus: bus1, date: d(-1), trip: trip1, status: ScheduleStatus.COMPLETED },
          { tripId: trip3.id, busId: bus2.id, bus: bus2, date: d(8), trip: trip3, status: ScheduleStatus.CANCELLED },
        ];

        for (const s of scheduleDefs) {
          await scheduleRepo.save(scheduleRepo.create({
            companyId: demoCompany.id,
            tripId: s.tripId,
            busId: s.busId,
            date: s.date,
            departureDateTime: buildDateTime(s.date, s.trip.departureTime),
            arrivalDateTime: buildDateTime(s.date, s.trip.arrivalTime),
            totalSeats: s.bus.capacity, // ← copié depuis bus.capacity
            status: s.status,
          }));
        }
        console.log(`✅ ${scheduleDefs.length} schedules créés`);

      } else {
        console.log(`⏭  Bus déjà existants (${existingBuses} bus)`);
      }

    }
  }

  await AppDataSource.destroy();
  console.log('🏁 Seed terminé');
}

seed().catch((err) => {
  console.error('❌ Seed échoué :', err);
  process.exit(1);
});
