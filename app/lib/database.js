import { PrismaClient } from '@prisma/client';

let prisma = null;

export async function getConnection() {
  try {
    if (!prisma) {
      prisma = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
      });
      
      console.log('Prisma database connected:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]);
    }
    return prisma;
  } catch (error) {
    console.error('Prisma connection failed:', error);
    throw new Error(`Failed to connect to Prisma database: ${error.message}`);
  }
}

export async function executeQuery(query, params = []) {
  try {
    const conn = await getConnection();
    
    // Execute raw query with parameters
    const result = await conn.$queryRawUnsafe(query, ...params);
    
    return result;
  } catch (error) {
    console.error('Query execution failed:', error);
    throw new Error('Query execution failed: ' + error.message);
  }
}

// Dashboard statistics using Prisma
export async function getDashboardStats() {
  try {
    const prisma = await getConnection();
    
    const [users, studios, userProfiles, messages, reviews] = await Promise.all([
      prisma.user.count(),
      prisma.studio.count({ where: { status: 'ACTIVE' } }),
      prisma.userProfile.count(),
      prisma.messages.count(),
      prisma.reviews.count(),
    ]);
    
    return {
      studios: studios,
      connections: messages, // Using messages as connections
      venues: studios, // Studios are venues in this context
      faqs: reviews, // Using reviews as FAQ-like content
      users: users,
      profiles: userProfiles,
    };
  } catch (error) {
    console.error('Failed to get dashboard stats:', error);
    throw new Error('Failed to retrieve dashboard statistics');
  }
}

export async function getAdminStats() {
  try {
    const prisma = await getConnection();
    
    const [
      totalStudios,
      studiosWithProfiles,
      studiosWithAvatars,
      studiosWithRates,
      allStudios
    ] = await Promise.all([
      // Total studios count
      prisma.studio.count(),
      
      // Studios with complete profiles (have first_name and about)
      prisma.studio.count({
        where: {
          owner: {
            profile: {
              AND: [
                { firstName: { not: null } },
                { about: { not: null } }
              ]
            }
          }
        }
      }),
      
      // Studios with avatars
      prisma.studio.count({
        where: {
          owner: {
            avatarUrl: { not: null }
          }
        }
      }),
      
      // Studios with rates (any rate tier filled)
      prisma.studio.count({
        where: {
          owner: {
            profile: {
              OR: [
                { rateTier1: { not: null } },
                { rateTier2: { not: null } },
                { rateTier3: { not: null } }
              ]
            }
          }
        }
      }),
      
      // Get all studios for percentage calculations
      prisma.studio.count()
    ]);
    
    const completenessPercentage = totalStudios > 0 ? Math.round((studiosWithProfiles / totalStudios) * 100) : 0;
    const avatarPercentage = totalStudios > 0 ? Math.round((studiosWithAvatars / totalStudios) * 100) : 0;
    const ratesPercentage = totalStudios > 0 ? Math.round((studiosWithRates / totalStudios) * 100) : 0;
    
    return {
      totalStudios,
      profileCompleteness: studiosWithProfiles,
      studiosWithAvatars,
      studiosWithRates,
      completenessPercentage,
      avatarPercentage,
      ratesPercentage
    };
  } catch (error) {
    console.error('Failed to get admin stats:', error);
    throw new Error('Failed to retrieve admin statistics');
  }
}

// Get recent connections (messages) for dashboard
export async function getRecentConnections() {
  try {
    const prisma = await getConnection();
    
    const recentMessages = await prisma.messages.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        users_messages_sender_idTousers: {
          select: {
            username: true,
            displayName: true,
            email: true
          }
        },
        users_messages_receiver_idTousers: {
          select: {
            username: true,
            displayName: true,
            email: true
          }
        }
      }
    });

    return recentMessages.map(message => ({
      id: message.id,
      name: message.users_messages_sender_idTousers?.displayName || message.users_messages_sender_idTousers?.username || 'Unknown',
      message: message.content || message.subject || '',
      created_at: message.created_at,
      status: 'Connected'
    }));
  } catch (error) {
    console.error('Failed to get recent connections:', error);
    throw new Error('Failed to retrieve recent connections');
  }
}

// List studios with Prisma (matching the existing API structure)
export async function listStudios({ q, hasCoords, limit = 50, offset = 0 } = {}) {
  try {
    const prisma = await getConnection();
    
    const where = {
      AND: [
        // Only active studios
        { status: 'ACTIVE' },
        // Search filter
        q ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { owner: { 
              OR: [
                { username: { contains: q, mode: 'insensitive' } },
                { displayName: { contains: q, mode: 'insensitive' } },
                { profile: {
                  OR: [
                    { firstName: { contains: q, mode: 'insensitive' } },
                    { lastName: { contains: q, mode: 'insensitive' } }
                  ]
                }}
              ]
            }}
          ]
        } : {},
        // Coordinates filter
        hasCoords ? {
          AND: [
            { latitude: { not: null } },
            { longitude: { not: null } }
          ]
        } : {}
      ]
    };

    const studios = await prisma.studio.findMany({
      where,
      include: {
        owner: {
          include: {
            profile: true
          }
        }
      },
      orderBy: { name: 'asc' },
      take: limit,
      skip: offset
    });

    // Transform to match expected format
    return studios.map(studio => ({
      id: studio.id,
      name: studio.name,
      display_name: studio.name,
      location: studio.address,
      latitude: studio.latitude ? parseFloat(studio.latitude.toString()) : null,
      longitude: studio.longitude ? parseFloat(studio.longitude.toString()) : null,
      url: studio.websiteUrl,
      instagram: studio.owner?.profile?.instagramUrl || '',
      youtubepage: studio.owner?.profile?.youtubeUrl || '',
      phone: studio.phone,
      about: studio.description,
      // Map owner data
      username: studio.owner?.username,
      displayname: studio.owner?.displayName,
      email: studio.owner?.email,
      first_name: studio.owner?.profile?.firstName,
      last_name: studio.owner?.profile?.lastName,
      status: 'active', // All returned studios are active
      joined: studio.createdAt
    }));
  } catch (error) {
    console.error('Failed to list studios:', error);
    throw new Error('Failed to retrieve studios list');
  }
}

// Get studio by ID with profile data
export async function getStudioById(id) {
  try {
    const prisma = await getConnection();
    
    const studio = await prisma.studio.findUnique({
      where: { id: id },
      include: {
        owner: {
          include: {
            profile: true
          }
        }
      }
    });
    
    if (!studio) return null;
    
    // Transform to match expected format
    return {
      id: studio.id,
      username: studio.owner?.username,
      displayname: studio.owner?.displayName,
      email: studio.owner?.email,
      status: studio.status.toLowerCase(),
      created_at: studio.createdAt,
      first_name: studio.owner?.profile?.firstName,
      last_name: studio.owner?.profile?.lastName,
      location: studio.owner?.profile?.location,
      address: studio.address,
      latitude: studio.latitude ? parseFloat(studio.latitude.toString()) : null,
      longitude: studio.longitude ? parseFloat(studio.longitude.toString()) : null,
      phone: studio.phone,
      url: studio.websiteUrl,
      instagram: studio.owner?.profile?.instagramUrl,
      youtubepage: studio.owner?.profile?.youtubeUrl,
      about: studio.description,
      // Additional profile fields
      shortabout: studio.owner?.profile?.shortAbout,
      category: '', // Not in new schema
      verified: studio.isVerified,
      featured: studio.owner?.profile?.isFeatured,
      avatar_image: studio.owner?.avatarUrl
    };
  } catch (error) {
    console.error('Failed to get studio by ID:', error);
    throw new Error('Failed to retrieve studio details');
  }
}

// Enhanced studio listing for admin with pagination and filtering
export async function listStudiosAdmin({ 
  page = 1, 
  limit = 20, 
  search = '', 
  status = '', 
  sortBy = 'created_at', 
  sortOrder = 'desc' 
} = {}) {
  try {
    const prisma = await getConnection();
    const offset = (page - 1) * limit;
    
    const where = {
      AND: [
        // Search filter
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { owner: { 
              OR: [
                { username: { contains: search, mode: 'insensitive' } },
                { displayName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { profile: {
                  OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { about: { contains: search, mode: 'insensitive' } },
                    { location: { contains: search, mode: 'insensitive' } }
                  ]
                }}
              ]
            }}
          ]
        } : {},
        // Status filter
        status && status !== 'all' ? {
          status: status.toUpperCase()
        } : {}
      ]
    };

    // Build orderBy
    let orderBy = {};
    if (sortBy === 'joined' || sortBy === 'created_at') {
      orderBy = { createdAt: sortOrder };
    } else if (sortBy === 'name') {
      orderBy = { name: sortOrder };
    } else if (sortBy === 'username') {
      orderBy = { owner: { username: sortOrder } };
    } else if (sortBy === 'email') {
      orderBy = { owner: { email: sortOrder } };
    } else {
      orderBy = { createdAt: sortOrder };
    }

    const [studios, totalCount] = await Promise.all([
      prisma.studio.findMany({
        where,
        include: {
          owner: {
            include: {
              profile: true
            }
          }
        },
        orderBy,
        take: limit,
        skip: offset
      }),
      prisma.studio.count({ where })
    ]);

    // Transform to match expected format
    const transformedStudios = studios.map(studio => ({
      id: studio.id,
      username: studio.owner?.username, // Use actual username
      display_name: studio.owner?.profile?.firstName || '', // Use profile firstName for display, no fallback to avoid "[username]'s Studio"
      email: studio.owner?.email,
      status: studio.status.toLowerCase(),
      joined: studio.createdAt,
      first_name: studio.owner?.profile?.firstName,
      last_name: studio.owner?.profile?.lastName,
      location: studio.owner?.profile?.location,
      phone: studio.phone,
      url: studio.websiteUrl,
      instagram: studio.owner?.profile?.instagramUrl,
      youtubepage: studio.owner?.profile?.youtubeUrl,
      about: studio.description,
      address: studio.address,
      shortabout: studio.owner?.profile?.shortAbout,
      category: '', // Not in new schema
      verified: studio.isVerified,
      featured: studio.owner?.profile?.isFeatured,
      avatar_image: studio.owner?.avatarUrl
    }));

    return {
      studios: transformedStudios,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: offset + limit < totalCount
      }
    };
  } catch (error) {
    console.error('Failed to list studios for admin:', error);
    throw new Error('Failed to retrieve studios list');
  }
}

// Create new studio
export async function createStudio(studioData) {
  try {
    const prisma = await getConnection();
    
    const { 
      username, 
      displayname, 
      email, 
      first_name = '', 
      last_name = '', 
      location = '', 
      phone = '', 
      url = '', 
      instagram = '', 
      youtubepage = '',
      about = ''
    } = studioData;

    // Create user and profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          username,
          displayName: displayname || username,
          email,
          role: 'USER'
        }
      });

      // Create profile
      const profile = await tx.userProfile.create({
        data: {
          userId: user.id,
          firstName: first_name,
          lastName: last_name,
          location,
          phone,
          about,
          instagramUrl: instagram,
          youtubeUrl: youtubepage
        }
      });

      // Create studio
      const studio = await tx.studio.create({
        data: {
          ownerId: user.id,
          name: displayname || username,
          description: about,
          studioType: 'HOME_STUDIO',
          address: location,
          websiteUrl: url,
          phone,
          status: 'ACTIVE'
        }
      });

      return { user, profile, studio };
    });

    return result.studio;
  } catch (error) {
    console.error('Create studio error:', error);
    throw new Error('Failed to create studio');
  }
}

// Update studio
export async function updateStudio(id, updateData) {
  try {
    const prisma = await getConnection();
    
    // Extract fields for different models
    const studioFields = {};
    const userFields = {};
    const profileFields = {};
    
    // Map fields to appropriate models
    if (updateData.name) studioFields.name = updateData.name;
    if (updateData.about) studioFields.description = updateData.about;
    if (updateData.address) studioFields.address = updateData.address;
    if (updateData.latitude) studioFields.latitude = parseFloat(updateData.latitude);
    if (updateData.longitude) studioFields.longitude = parseFloat(updateData.longitude);
    if (updateData.url) studioFields.websiteUrl = updateData.url;
    if (updateData.phone) studioFields.phone = updateData.phone;
    
    if (updateData.displayname) userFields.displayName = updateData.displayname;
    if (updateData.email) userFields.email = updateData.email;
    
    if (updateData.first_name) profileFields.firstName = updateData.first_name;
    if (updateData.last_name) profileFields.lastName = updateData.last_name;
    if (updateData.location) profileFields.location = updateData.location;
    if (updateData.instagram) profileFields.instagramUrl = updateData.instagram;
    if (updateData.youtubepage) profileFields.youtubeUrl = updateData.youtubepage;
    if (updateData.shortabout) profileFields.shortAbout = updateData.shortabout;

    // Update in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update studio
      const studio = await tx.studio.update({
        where: { id },
        data: studioFields
      });

      // Update user if needed
      if (Object.keys(userFields).length > 0) {
        await tx.user.update({
          where: { id: studio.ownerId },
          data: userFields
        });
      }

      // Update profile if needed
      if (Object.keys(profileFields).length > 0) {
        await tx.userProfile.update({
          where: { userId: studio.ownerId },
          data: profileFields
        });
      }

      return studio;
    });

    return result;
  } catch (error) {
    console.error('Update studio error:', error);
    throw new Error('Failed to update studio');
  }
}

// Delete studio
export async function deleteStudio(id) {
  try {
    const prisma = await getConnection();
    
    // Delete studio (user and profile will be handled based on business logic)
    await prisma.studio.delete({
      where: { id }
    });

    return true;
  } catch (error) {
    console.error('Delete studio error:', error);
    throw new Error('Failed to delete studio');
  }
}

// Cleanup function
export async function cleanup() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

// Legacy compatibility functions (for existing code that might still use these)
export async function getTables() {
  // Return mock table list for compatibility
  return ['users', 'user_profiles', 'studios'];
}

export async function getTableData(tableName, limit = 50, offset = 0) {
  try {
    const prisma = await getConnection();
    
    switch (tableName) {
      case 'users':
        const users = await prisma.user.findMany({
          take: limit,
          skip: offset,
          include: { profile: true }
        });
        const userCount = await prisma.user.count();
        return {
          data: users,
          total: userCount,
          limit,
          offset
        };
      
      case 'studios':
        const studios = await prisma.studio.findMany({
          take: limit,
          skip: offset,
          include: { owner: { include: { profile: true } } }
        });
        const studioCount = await prisma.studio.count();
        return {
          data: studios,
          total: studioCount,
          limit,
          offset
        };
      
      default:
        throw new Error('Table not found');
    }
  } catch (error) {
    console.error('Failed to get table data:', error);
    throw new Error('Failed to retrieve table data: ' + error.message);
  }
}

export async function executeSelectQuery(query) {
  // Basic security check - only allow SELECT statements
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery.startsWith('select')) {
    throw new Error('Only SELECT queries are allowed');
  }
  
  try {
    const startTime = Date.now();
    const results = await executeQuery(query);
    const executionTime = Date.now() - startTime;
    
    return {
      data: results,
      executionTime,
      rowCount: Array.isArray(results) ? results.length : 1
    };
  } catch (error) {
    console.error('SELECT query failed:', error);
    throw new Error('Query execution failed: ' + error.message);
  }
}

export async function listFAQ({ search } = {}) {
  try {
    const prisma = await getConnection();
    
    const where = search ? {
      OR: [
        { question: { contains: search, mode: 'insensitive' } },
        { answer: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const faqs = await prisma.faq.findMany({
      where,
      orderBy: { sort_order: 'asc' }
    });

    return faqs;
  } catch (error) {
    console.error('Failed to list FAQs:', error);
    throw new Error('Failed to retrieve FAQs');
  }
}

export async function listContacts() {
  try {
    const prisma = await getConnection();
    
    const contacts = await prisma.contact.findMany({
      where: { accepted: 1 },
      orderBy: { id: 'desc' }
    });

    return contacts;
  } catch (error) {
    console.error('Failed to list contacts:', error);
    throw new Error('Failed to retrieve contacts');
  }
}

export async function listVenues({ search, hasCoords, limit = 50, offset = 0 } = {}) {
  try {
    const prisma = await getConnection();
    
    let where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (hasCoords) {
      where.AND = [
        { latitude: { not: null } },
        { longitude: { not: null } }
      ];
    }

    const venues = await prisma.poi.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset
    });

    return venues;
  } catch (error) {
    console.error('Failed to list venues:', error);
    throw new Error('Failed to retrieve venues');
  }
}