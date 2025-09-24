import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '../../../lib/database.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const prisma = await getConnection();

    // Get all user profiles with firstName (studio names)
    const profiles = await prisma.userProfile.findMany({
      where: {
        firstName: {
          not: null,
          not: ''
        }
      },
      select: {
        firstName: true,
        user: {
          select: {
            username: true
          }
        }
      }
    });

    const studioNames = profiles
      .map(p => p.firstName)
      .filter(name => name && name.trim() !== '');

    if (studioNames.length === 0) {
      return NextResponse.json({
        totalProfiles: 0,
        averageLength: 0,
        minLength: 0,
        maxLength: 0,
        longestName: '',
        shortestName: '',
        over30Characters: 0,
        over25Characters: 0,
        over20Characters: 0,
        lengthDistribution: {}
      });
    }

    const lengths = studioNames.map(name => name.length);
    const totalLength = lengths.reduce((sum, length) => sum + length, 0);
    const averageLength = Math.round((totalLength / lengths.length) * 100) / 100;

    const minLength = Math.min(...lengths);
    const maxLength = Math.max(...lengths);
    
    const longestName = studioNames.find(name => name.length === maxLength);
    const shortestName = studioNames.find(name => name.length === minLength);

    const over30Characters = studioNames.filter(name => name.length > 30).length;
    const over25Characters = studioNames.filter(name => name.length > 25).length;
    const over20Characters = studioNames.filter(name => name.length > 20).length;

    // Create length distribution
    const lengthDistribution = {};
    lengths.forEach(length => {
      const bucket = Math.floor(length / 5) * 5; // Group by 5s (0-4, 5-9, 10-14, etc.)
      const key = `${bucket}-${bucket + 4}`;
      lengthDistribution[key] = (lengthDistribution[key] || 0) + 1;
    });

    // Get some examples of different length names
    const examples = {
      short: studioNames.filter(name => name.length <= 15).slice(0, 5),
      medium: studioNames.filter(name => name.length > 15 && name.length <= 25).slice(0, 5),
      long: studioNames.filter(name => name.length > 25 && name.length <= 35).slice(0, 5),
      veryLong: studioNames.filter(name => name.length > 35).slice(0, 5)
    };

    return NextResponse.json({
      totalProfiles: studioNames.length,
      averageLength: averageLength,
      minLength: minLength,
      maxLength: maxLength,
      longestName: longestName,
      shortestName: shortestName,
      over30Characters: over30Characters,
      over25Characters: over25Characters,
      over20Characters: over20Characters,
      lengthDistribution: lengthDistribution,
      examples: examples,
      summary: {
        percentageOver30: Math.round((over30Characters / studioNames.length) * 100),
        percentageOver25: Math.round((over25Characters / studioNames.length) * 100),
        percentageOver20: Math.round((over20Characters / studioNames.length) * 100)
      }
    });

  } catch (error) {
    console.error('Studio name stats API error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message 
    }, { status: 500 });
  }
}

