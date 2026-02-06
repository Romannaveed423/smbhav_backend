import { Response, NextFunction } from 'express';
import Campaign from '../models/Campaign';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';
import { NotFoundError } from '../utils/errors';

export const getCampaigns = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const now = new Date();
    const campaigns = await Campaign.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ createdAt: -1 });

    // Add user progress to each campaign
    const campaignsWithProgress = await Promise.all(
      campaigns.map(async (campaign) => {
        const participant = campaign.participants.find(
          (p) => p.userId.toString() === req.user?.userId
        );
        return {
          ...campaign.toObject(),
          userProgress: participant || null,
        };
      })
    );

    res.json({
      success: true,
      data: campaignsWithProgress,
    });
  } catch (error) {
    next(error);
  }
};

export const getCampaignById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    const participant = campaign.participants.find(
      (p) => p.userId.toString() === req.user?.userId
    );

    res.json({
      success: true,
      data: {
        ...campaign.toObject(),
        userProgress: participant || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaderboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { campaignId } = req.query;
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    const leaderboard = campaign.participants
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 100)
      .map(async (participant, index) => {
        const user = await User.findById(participant.userId).select('name phoneNumber');
        return {
          rank: index + 1,
          user,
          progress: participant.progress,
          completed: participant.completed,
        };
      });

    res.json({
      success: true,
      data: await Promise.all(leaderboard),
    });
  } catch (error) {
    next(error);
  }
};

