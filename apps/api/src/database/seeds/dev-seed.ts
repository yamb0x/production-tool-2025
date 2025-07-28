import { db } from '../connection';
import { 
  tenants, 
  users, 
  artists, 
  artistProfiles,
  projects, 
  bookings, 
  jobListings,
  jobApplications,
  availabilityPatterns,
  projectPhases
} from '../../../../src/lib/db/schema';

export async function seedDevelopmentData() {
  console.log('🌱 Starting development data seeding...');

  try {
    // 1. Create test tenants
    console.log('Creating tenants...');
    const [studio, freelancer, enterprise] = await db.insert(tenants).values([
      {
        name: 'Pixel Studios',
        type: 'studio',
        settings: {
          timezone: 'America/Los_Angeles',
          workingHours: { start: '09:00', end: '18:00' },
          bookingRules: {
            maxAdvanceBooking: 90,
            minBookingDuration: 4,
            allowWeekendBookings: false
          }
        }
      },
      {
        name: 'Maya Freelance',
        type: 'freelancer',
        settings: {
          timezone: 'America/New_York',
          workingHours: { start: '10:00', end: '19:00' }
        }
      },
      {
        name: 'VFX Enterprises Corp',
        type: 'enterprise',
        settings: {
          timezone: 'Europe/London',
          workingHours: { start: '08:00', end: '17:00' },
          bookingRules: {
            maxAdvanceBooking: 180,
            requireApproval: true,
            allowMultipleProjects: true
          }
        }
      }
    ]).returning();

    // 2. Create test users
    console.log('Creating users...');
    const [studioOwner, studioManager, freelancerUser, enterpriseOwner] = await db.insert(users).values([
      {
        clerkId: 'user_studio_owner_123',
        email: 'owner@pixelstudios.com',
        tenantId: studio.id,
        role: 'owner',
        firstName: 'John',
        lastName: 'Smith',
        settings: {
          notifications: { email: true, push: true },
          preferences: { theme: 'dark' }
        }
      },
      {
        clerkId: 'user_studio_manager_456',
        email: 'manager@pixelstudios.com',
        tenantId: studio.id,
        role: 'manager',
        firstName: 'Sarah',
        lastName: 'Johnson'
      },
      {
        clerkId: 'user_freelancer_789',
        email: 'maya@freelance.com',
        tenantId: freelancer.id,
        role: 'owner',
        firstName: 'Maya',
        lastName: 'Rodriguez'
      },
      {
        clerkId: 'user_enterprise_owner_012',
        email: 'admin@vfxenterprises.com',
        tenantId: enterprise.id,
        role: 'owner',
        firstName: 'David',
        lastName: 'Chen'
      }
    ]).returning();

    // 3. Create test artists
    console.log('Creating artists...');
    const [artist1, artist2, artist3, artist4, artist5] = await db.insert(artists).values([
      {
        tenantId: studio.id,
        userId: studioManager.id,
        name: 'Alex Thompson',
        email: 'alex@pixelstudios.com',
        type: '3d_artist',
        skills: ['Maya', 'Blender', '3ds Max', 'Substance Painter'],
        hourlyRate: '75.00',
        dailyRate: '600.00',
        isActive: true,
        isFreelancer: false,
        metadata: {
          portfolio: 'https://alexthompson.artstation.com',
          experience: 5,
          software: ['Maya', 'Blender', '3ds Max', 'Substance Painter', 'Photoshop'],
          certifications: ['Autodesk Maya Certified User']
        }
      },
      {
        tenantId: studio.id,
        name: 'Emma Davis',
        email: 'emma@example.com',
        type: 'animator',
        skills: ['Maya', 'MotionBuilder', 'After Effects'],
        hourlyRate: '80.00',
        dailyRate: '640.00',
        isActive: true,
        isFreelancer: true,
        metadata: {
          portfolio: 'https://emmadavis.com',
          experience: 7,
          software: ['Maya', 'MotionBuilder', 'After Effects', 'Cinema 4D']
        }
      },
      {
        tenantId: freelancer.id,
        userId: freelancerUser.id,
        name: 'Maya Rodriguez',
        email: 'maya@freelance.com',
        type: 'compositor',
        skills: ['Nuke', 'After Effects', 'DaVinci Resolve'],
        hourlyRate: '90.00',
        dailyRate: '720.00',
        isActive: true,
        isFreelancer: true,
        metadata: {
          portfolio: 'https://mayarodriguez.com',
          experience: 8,
          software: ['Nuke', 'After Effects', 'DaVinci Resolve', 'Fusion']
        }
      },
      {
        tenantId: enterprise.id,
        name: 'James Wilson',
        email: 'james@vfxenterprises.com',
        type: 'lighter',
        skills: ['Maya', 'Arnold', 'V-Ray', 'Katana'],
        hourlyRate: '85.00',
        dailyRate: '680.00',
        isActive: true,
        isFreelancer: false,
        metadata: {
          portfolio: 'https://jameswilson.com',
          experience: 6,
          software: ['Maya', 'Arnold', 'V-Ray', 'Katana', 'Houdini']
        }
      },
      {
        tenantId: enterprise.id,
        name: 'Lisa Park',
        email: 'lisa@vfxenterprises.com',
        type: 'fx_artist',
        skills: ['Houdini', 'Maya', 'Realflow', 'Krakatoa'],
        hourlyRate: '95.00',
        dailyRate: '760.00',
        isActive: true,
        isFreelancer: false,
        metadata: {
          portfolio: 'https://lisapark.artstation.com',
          experience: 9,
          software: ['Houdini', 'Maya', 'Realflow', 'Krakatoa', 'Nuke']
        }
      }
    ]).returning();

    // 4. Create artist profiles
    console.log('Creating artist profiles...');
    await db.insert(artistProfiles).values([
      {
        artistId: artist1.id,
        bio: 'Experienced 3D artist specializing in character modeling and environmental assets. Passionate about photorealistic rendering and detail work.',
        headline: 'Senior 3D Artist & Character Specialist',
        location: 'Los Angeles, CA',
        timezone: 'America/Los_Angeles',
        phone: '+1 (555) 123-4567',
        website: 'https://alexthompson.com',
        socialLinks: {
          linkedin: 'https://linkedin.com/in/alexthompson',
          artstation: 'https://alexthompson.artstation.com',
          instagram: 'https://instagram.com/alex3dart'
        },
        portfolio: [
          {
            id: '1',
            title: 'Sci-Fi Character Series',
            description: 'Collection of futuristic character designs',
            imageUrl: 'https://example.com/portfolio/scifi-chars.jpg',
            projectType: 'Character Design',
            tools: ['Maya', 'Substance Painter', 'Arnold'],
            date: '2024-01-15'
          }
        ],
        experience: [
          {
            id: '1',
            company: 'Pixel Studios',
            position: 'Senior 3D Artist',
            startDate: '2022-03-01',
            current: true,
            description: 'Lead character modeling for AAA game projects',
            projects: ['Game Project Alpha', 'VR Experience Beta']
          }
        ],
        availability: {
          status: 'available',
          remoteWork: true,
          willingToTravel: true,
          preferredLocations: ['Los Angeles', 'San Francisco']
        },
        preferences: {
          projectTypes: ['Games', 'Film', 'Commercial'],
          minimumDuration: 2,
          preferredRateType: 'daily'
        },
        visibility: 'studio_only',
        isVerified: true,
        verifiedAt: new Date()
      },
      {
        artistId: artist2.id,
        bio: 'Animation specialist with expertise in character animation and motion capture cleanup.',
        headline: 'Character Animator & Motion Specialist',
        location: 'Vancouver, BC',
        timezone: 'America/Vancouver',
        socialLinks: {
          artstation: 'https://emmadavis.artstation.com',
          vimeo: 'https://vimeo.com/emmadavis'
        },
        availability: {
          status: 'available',
          remoteWork: true,
          willingToTravel: false
        },
        visibility: 'public',
        isVerified: true,
        verifiedAt: new Date()
      },
      {
        artistId: artist3.id,
        bio: 'Freelance compositor with extensive experience in VFX and color grading.',
        headline: 'VFX Compositor & Color Artist',
        location: 'New York, NY',
        timezone: 'America/New_York',
        website: 'https://mayarodriguez.com',
        availability: {
          status: 'busy',
          nextAvailable: '2024-03-01',
          remoteWork: true,
          willingToTravel: true
        },
        visibility: 'public',
        isVerified: true,
        verifiedAt: new Date()
      }
    ]);

    // 5. Create test projects
    console.log('Creating projects...');
    const [project1, project2, project3] = await db.insert(projects).values([
      {
        tenantId: studio.id,
        name: 'Game Project Alpha',
        code: 'GPA-2024',
        description: 'Next-generation AAA game with photorealistic characters',
        status: 'active',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-12-15'),
        budget: '500000.00',
        clientName: 'Epic Games Studios',
        metadata: {
          phases: [
            {
              id: '1',
              name: 'Pre-production',
              startDate: '2024-01-15',
              endDate: '2024-03-15',
              dependencies: []
            },
            {
              id: '2',
              name: 'Production',
              startDate: '2024-03-16',
              endDate: '2024-10-15',
              dependencies: ['1']
            }
          ],
          color: '#FF6B6B',
          priority: 'high'
        }
      },
      {
        tenantId: studio.id,
        name: 'Commercial Spot - Nike',
        code: 'NIKE-2024-Q1',
        description: 'High-end commercial spot featuring product visualization',
        status: 'planning',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-04-30'),
        budget: '150000.00',
        clientName: 'Nike Inc.',
        metadata: {
          color: '#4ECDC4',
          priority: 'medium'
        }
      },
      {
        tenantId: enterprise.id,
        name: 'Feature Film VFX',
        code: 'FILM-VFX-001',
        description: 'VFX sequences for upcoming blockbuster film',
        status: 'active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-08-31'),
        budget: '2000000.00',
        clientName: 'Universal Pictures',
        metadata: {
          color: '#95E1D3',
          priority: 'critical'
        }
      }
    ]).returning();

    // 6. Create project phases
    console.log('Creating project phases...');
    await db.insert(projectPhases).values([
      {
        projectId: project1.id,
        name: 'Character Modeling',
        description: 'Main character asset creation',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-04-30'),
        progress: 65,
        color: '#FF6B6B',
        orderIndex: 1
      },
      {
        projectId: project1.id,
        name: 'Animation',
        description: 'Character animation and rigging',
        startDate: new Date('2024-04-15'),
        endDate: new Date('2024-07-31'),
        progress: 30,
        color: '#4ECDC4',
        orderIndex: 2
      },
      {
        projectId: project3.id,
        name: 'Creature VFX',
        description: 'Digital creature creation and animation',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-15'),
        progress: 45,
        color: '#95E1D3',
        orderIndex: 1
      }
    ]);

    // 7. Create test bookings
    console.log('Creating bookings...');
    await db.insert(bookings).values([
      {
        tenantId: studio.id,
        artistId: artist1.id,
        projectId: project1.id,
        userId: studioManager.id,
        startTime: new Date('2024-02-01T09:00:00Z'),
        endTime: new Date('2024-02-01T17:00:00Z'),
        status: 'confirmed',
        title: 'Character Modeling - Hero Characters',
        notes: 'Focus on main protagonist design',
        rate: '600.00',
        rateType: 'daily',
        totalAmount: '600.00',
        createdBy: studioManager.id,
        metadata: {
          color: '#FF6B6B',
          tags: ['character', 'modeling', 'hero'],
          priority: 1
        }
      },
      {
        tenantId: studio.id,
        artistId: artist2.id,
        projectId: project1.id,
        userId: studioManager.id,
        startTime: new Date('2024-03-01T10:00:00Z'),
        endTime: new Date('2024-03-01T18:00:00Z'),
        status: 'pencil',
        holdType: 'soft',
        holdExpiresAt: new Date('2024-02-20T17:00:00Z'),
        title: 'Character Animation Review',
        rate: '640.00',
        rateType: 'daily',
        totalAmount: '640.00',
        createdBy: studioManager.id,
        metadata: {
          color: '#4ECDC4',
          tags: ['animation', 'review']
        }
      },
      {
        tenantId: enterprise.id,
        artistId: artist5.id,
        projectId: project3.id,
        userId: enterpriseOwner.id,
        startTime: new Date('2024-02-15T08:00:00Z'),
        endTime: new Date('2024-02-15T16:00:00Z'),
        status: 'confirmed',
        title: 'FX Simulation Setup',
        notes: 'Initial particle system setup for creature scenes',
        rate: '760.00',
        rateType: 'daily',
        totalAmount: '760.00',
        createdBy: enterpriseOwner.id,
        metadata: {
          color: '#95E1D3',
          tags: ['fx', 'simulation', 'particles']
        }
      }
    ]);

    // 8. Create availability patterns
    console.log('Creating availability patterns...');
    await db.insert(availabilityPatterns).values([
      {
        artistId: artist1.id,
        name: 'Regular Work Schedule',
        pattern: {
          type: 'weekly',
          weekly: [
            { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }, // Monday
            { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' }, // Tuesday
            { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' }, // Wednesday
            { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' }, // Thursday
            { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' }  // Friday
          ]
        },
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
        priority: 1
      },
      {
        artistId: artist3.id,
        name: 'Freelancer Flexible Schedule',
        pattern: {
          type: 'weekly',
          weekly: [
            { dayOfWeek: 1, startTime: '10:00', endTime: '19:00' },
            { dayOfWeek: 2, startTime: '10:00', endTime: '19:00' },
            { dayOfWeek: 3, startTime: '10:00', endTime: '19:00' },
            { dayOfWeek: 4, startTime: '10:00', endTime: '19:00' },
            { dayOfWeek: 5, startTime: '10:00', endTime: '16:00' },
            { dayOfWeek: 6, startTime: '12:00', endTime: '17:00' } // Saturday
          ]
        },
        validFrom: new Date('2024-01-01'),
        priority: 1
      }
    ]);

    // 9. Create job listings
    console.log('Creating job listings...');
    const [job1, job2] = await db.insert(jobListings).values([
      {
        tenantId: studio.id,
        projectId: project2.id,
        title: 'Senior 3D Modeler - Commercial Project',
        description: 'We are seeking an experienced 3D modeler for a high-profile commercial project.',
        requirements: '5+ years experience in Maya, Strong portfolio in product visualization, Experience with PBR workflows',
        responsibilities: 'Create detailed product models, Collaborate with lighting team, Ensure model optimization',
        type: 'contract',
        artistType: 'modeler',
        status: 'open',
        location: 'Los Angeles, CA',
        isRemote: true,
        rateMin: '70.00',
        rateMax: '90.00',
        rateType: 'hourly',
        startDate: new Date('2024-03-01'),
        duration: '3 months',
        applicationDeadline: new Date('2024-02-25'),
        skills: ['Maya', '3ds Max', 'Substance Painter', 'Arnold', 'V-Ray'],
        benefits: ['Health Insurance', 'Flexible Schedule', 'Remote Work'],
        metadata: {
          experienceLevel: 'senior',
          teamSize: '8-12 people',
          department: 'Modeling'
        },
        contactEmail: 'jobs@pixelstudios.com',
        createdBy: studioOwner.id,
        publishedAt: new Date()
      },
      {
        tenantId: enterprise.id,
        title: 'VFX Compositor - Feature Film',
        description: 'Join our team working on a major blockbuster film. Looking for experienced compositors.',
        requirements: 'Expert level Nuke skills, Feature film experience, Color grading knowledge',
        responsibilities: 'Composite VFX shots, Color matching, Final delivery preparation',
        type: 'full_time',
        artistType: 'compositor',
        status: 'open',
        location: 'London, UK',
        isRemote: false,
        rateMin: '80000.00',
        rateMax: '120000.00',
        rateType: 'annual',
        startDate: new Date('2024-04-01'),
        duration: '12 months',
        applicationDeadline: new Date('2024-03-15'),
        skills: ['Nuke', 'After Effects', 'DaVinci Resolve', 'Flame'],
        benefits: ['Health Insurance', 'Pension', 'Training Budget'],
        metadata: {
          experienceLevel: 'senior',
          teamSize: '20+ people',
          department: 'Compositing'
        },
        contactEmail: 'careers@vfxenterprises.com',
        createdBy: enterpriseOwner.id,
        publishedAt: new Date()
      }
    ]).returning();

    // 10. Create job applications
    console.log('Creating job applications...');
    await db.insert(jobApplications).values([
      {
        jobListingId: job1.id,
        artistId: artist1.id,
        status: 'pending',
        coverLetter: 'I am very interested in this position and believe my 5 years of experience in 3D modeling would be a great fit.',
        resumeUrl: 'https://example.com/resume/alex-thompson.pdf',
        portfolioUrl: 'https://alexthompson.artstation.com',
        availableFrom: new Date('2024-03-01'),
        expectedRate: '85.00',
        metadata: {
          source: 'website',
          questionnaire: {
            'maya_experience': '5 years',
            'commercial_experience': 'Yes'
          }
        }
      },
      {
        jobListingId: job2.id,
        artistId: artist3.id,
        status: 'reviewing',
        coverLetter: 'With 8 years of compositing experience including feature films, I would love to join your team.',
        resumeUrl: 'https://example.com/resume/maya-rodriguez.pdf',
        portfolioUrl: 'https://mayarodriguez.com',
        availableFrom: new Date('2024-04-01'),
        expectedRate: '95000.00',
        reviewedBy: enterpriseOwner.id,
        reviewedAt: new Date(),
        metadata: {
          source: 'referral',
          referral: 'Jane Doe - VFX Supervisor'
        }
      }
    ]);

    console.log('✅ Development data seeding completed successfully!');
    console.log('📊 Data Summary:');
    console.log('- 3 Tenants (Studio, Freelancer, Enterprise)');
    console.log('- 4 Users with different roles');
    console.log('- 5 Artists with profiles');
    console.log('- 3 Projects with phases');
    console.log('- 3 Bookings (confirmed and pencil)');
    console.log('- 2 Availability patterns');
    console.log('- 2 Job listings with applications');

  } catch (error) {
    console.error('❌ Error seeding development data:', error);
    throw error;
  }
}

// Export for use in migration scripts
export default seedDevelopmentData;