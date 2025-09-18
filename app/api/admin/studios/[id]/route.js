import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getStudioById, updateStudio, deleteStudio, getConnection } from '../../../../lib/database.js';

export const dynamic = 'force-dynamic';

// GET - Get single studio by ID with full profile data
export async function GET(request, { params }) {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const prisma = await getConnection();
    
    // Get studio with owner and profile data using Prisma
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

    if (!studio) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 });
    }

    // Transform to match expected format for the frontend
    const studioData = {
      id: studio.id,
      username: studio.owner?.username,
      display_name: studio.owner?.displayName,
      email: studio.owner?.email,
      status: studio.status?.toLowerCase(),
      joined: studio.createdAt,
      first_name: studio.owner?.profile?.firstName,
      last_name: studio.owner?.profile?.lastName,
      location: studio.owner?.profile?.location,
      address: studio.address,
      phone: studio.phone,
      url: studio.websiteUrl,
      instagram: studio.owner?.profile?.instagramUrl,
      youtubepage: studio.owner?.profile?.youtubeUrl,
      about: studio.owner?.profile?.about,
      latitude: studio.latitude ? parseFloat(studio.latitude.toString()) : null,
      longitude: studio.longitude ? parseFloat(studio.longitude.toString()) : null,
      shortabout: studio.owner?.profile?.shortAbout,
      category: '', // Not in new schema
      facebook: studio.owner?.profile?.facebookUrl,
      twitter: studio.owner?.profile?.twitterUrl,
      linkedin: studio.owner?.profile?.linkedinUrl,
      soundcloud: studio.owner?.profile?.soundcloudUrl,
      vimeo: studio.owner?.profile?.vimeoUrl,
      verified: studio.isVerified,
      featured: studio.owner?.profile?.isFeatured,
      avatar_image: studio.owner?.avatarUrl
    };
    
    // Structure the data to match what the frontend expects
    const profile = {
      // Basic user fields (not in _meta)
      id: studioData.id,
      username: studioData.username,
      display_name: studioData.display_name,
      email: studioData.email,
      status: studioData.status,
      joined: studioData.joined,
      
      // All profile fields go in _meta for frontend compatibility
      _meta: {
        first_name: studioData.first_name,
        last_name: studioData.last_name,
        location: studioData.location,
        address: studioData.address,
        phone: studioData.phone,
        url: studioData.url,
        instagram: studioData.instagram,
        youtubepage: studioData.youtubepage,
        about: studioData.about,
        latitude: studioData.latitude,
        longitude: studioData.longitude,
        shortabout: studioData.shortabout,
        category: studioData.category,
        facebook: studioData.facebook,
        twitter: studioData.twitter,
        linkedin: studioData.linkedin,
        soundcloud: studioData.soundcloud,
        vimeo: studioData.vimeo,
        verified: studioData.verified ? '1' : '0',
        featured: studioData.featured ? '1' : '0',
        avatar_image: studioData.avatar_image
      }
    };

    return NextResponse.json({ profile });

  } catch (error) {
    console.error('Get studio error:', error);
    return NextResponse.json({ error: 'Failed to fetch studio' }, { status: 500 });
  }
}

// PUT - Update studio with comprehensive profile data
export async function PUT(request, { params }) {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const prisma = await getConnection();

    // Check if studio exists
    const existingStudio = await prisma.studio.findUnique({
      where: { id: id },
      include: {
        owner: {
          include: {
            profile: true
          }
        }
      }
    });

    if (!existingStudio) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 });
    }

    // Prepare user updates
    const userUpdateData = {};
    if (body.username !== undefined) userUpdateData.username = body.username;
    if (body.display_name !== undefined) userUpdateData.displayName = body.display_name;
    if (body.email !== undefined) userUpdateData.email = body.email;

    // Prepare studio updates
    const studioUpdateData = {};
    if (body._meta?.address !== undefined) studioUpdateData.address = body._meta.address;
    if (body._meta?.phone !== undefined) studioUpdateData.phone = body._meta.phone;
    if (body._meta?.url !== undefined) studioUpdateData.websiteUrl = body._meta.url;
    if (body._meta?.latitude !== undefined) studioUpdateData.latitude = parseFloat(body._meta.latitude) || null;
    if (body._meta?.longitude !== undefined) studioUpdateData.longitude = parseFloat(body._meta.longitude) || null;
    if (body._meta?.verified !== undefined) studioUpdateData.isVerified = body._meta.verified === '1' || body._meta.verified === true;

    // Prepare profile updates
    const profileUpdateData = {};
    if (body._meta?.first_name !== undefined) profileUpdateData.firstName = body._meta.first_name;
    if (body._meta?.last_name !== undefined) profileUpdateData.lastName = body._meta.last_name;
    if (body._meta?.location !== undefined) profileUpdateData.location = body._meta.location;
    if (body._meta?.about !== undefined) profileUpdateData.about = body._meta.about;
    if (body._meta?.shortabout !== undefined) profileUpdateData.shortAbout = body._meta.shortabout;
    if (body._meta?.facebook !== undefined) profileUpdateData.facebookUrl = body._meta.facebook;
    if (body._meta?.twitter !== undefined) profileUpdateData.twitterUrl = body._meta.twitter;
    if (body._meta?.linkedin !== undefined) profileUpdateData.linkedinUrl = body._meta.linkedin;
    if (body._meta?.instagram !== undefined) profileUpdateData.instagramUrl = body._meta.instagram;
    if (body._meta?.youtubepage !== undefined) profileUpdateData.youtubeUrl = body._meta.youtubepage;
    if (body._meta?.soundcloud !== undefined) profileUpdateData.soundcloudUrl = body._meta.soundcloud;
    if (body._meta?.vimeo !== undefined) profileUpdateData.vimeoUrl = body._meta.vimeo;
    if (body._meta?.featured !== undefined) profileUpdateData.isFeatured = body._meta.featured === '1' || body._meta.featured === true;

    // Perform updates using Prisma transactions
    await prisma.$transaction(async (tx) => {
      // Update user if there are user changes
      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: existingStudio.ownerId },
          data: userUpdateData
        });
      }

      // Update studio if there are studio changes
      if (Object.keys(studioUpdateData).length > 0) {
        await tx.studio.update({
          where: { id: id },
          data: studioUpdateData
        });
      }

      // Update profile if there are profile changes
      if (Object.keys(profileUpdateData).length > 0) {
        await tx.userProfile.upsert({
          where: { userId: existingStudio.ownerId },
          update: profileUpdateData,
          create: {
            userId: existingStudio.ownerId,
            ...profileUpdateData
          }
        });
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Studio profile updated successfully'
    });

  } catch (error) {
    console.error('Update studio error:', error);
    return NextResponse.json({ error: 'Failed to update studio' }, { status: 500 });
  }
}

// DELETE - Delete studio
export async function DELETE(request, { params }) {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const prisma = await getConnection();
    
    // Check if studio exists
    const existingStudio = await prisma.studio.findUnique({
      where: { id: id },
      include: {
        owner: true
      }
    });

    if (!existingStudio) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 });
    }

    const username = existingStudio.owner.username;

    // Delete studio using Prisma (cascading deletes will handle related records)
    await prisma.studio.delete({
      where: { id: id }
    });

    return NextResponse.json({ 
      message: `Studio '${username}' deleted successfully`
    });

  } catch (error) {
    console.error('Delete studio error:', error);
    return NextResponse.json({ error: 'Failed to delete studio' }, { status: 500 });
  }
}
