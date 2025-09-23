import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '../../../lib/database.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { batchSize = 50, startFrom = 0, dryRun = false } = body;

    const prisma = await getConnection();

    // Get all user profiles with firstName longer than 30 characters
    const longNames = await prisma.userProfile.findMany({
      where: {
        firstName: {
          not: null
        }
      },
      include: {
        user: true
      },
      skip: startFrom,
      take: batchSize
    });

    const results = [];
    let updated = 0;
    let skipped = 0;

    for (const profile of longNames) {
      const originalName = profile.firstName || '';
      
      if (originalName.length > 30) {
        const truncatedName = originalName.substring(0, 30);
        
        console.log(`📝 ${profile.user?.username || 'Unknown'}: "${originalName}" (${originalName.length} chars) → "${truncatedName}" (30 chars)`);
        
        if (!dryRun) {
          await prisma.userProfile.update({
            where: {
              id: profile.id
            },
            data: {
              firstName: truncatedName
            }
          });
          updated++;
        }

        results.push({
          username: profile.user?.username || 'Unknown',
          email: profile.user?.email || 'Unknown',
          originalName: originalName,
          originalLength: originalName.length,
          truncatedName: truncatedName,
          truncatedLength: 30,
          charactersRemoved: originalName.length - 30
        });
      } else {
        skipped++;
        console.log(`✅ ${profile.user?.username || 'Unknown'}: "${originalName}" (${originalName.length} chars) - OK`);
      }
    }

    // Get total count of profiles with names longer than 45 characters
    const totalLongNames = await prisma.userProfile.count({
      where: {
        firstName: {
          not: null
        }
      }
    });

    const longNamesCount = await prisma.userProfile.count({
      where: {
        AND: [
          { firstName: { not: null } },
          { firstName: { not: '' } }
        ]
      }
    });

    return NextResponse.json({
      success: true,
      dryRun: dryRun,
      processed: longNames.length,
      updated: updated,
      skipped: skipped,
      results: results,
      nextBatchStart: startFrom + batchSize,
      totalProfiles: totalLongNames,
      estimatedLongNames: results.length,
      summary: {
        longestName: results.length > 0 ? Math.max(...results.map(r => r.originalLength)) : 0,
        totalCharactersRemoved: results.reduce((sum, r) => sum + r.charactersRemoved, 0),
        averageLength: results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.originalLength, 0) / results.length) : 0
      }
    });

  } catch (error) {
    console.error('Truncate studio names API error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message 
    }, { status: 500 });
  }
}
