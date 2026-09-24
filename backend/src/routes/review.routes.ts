import { Router } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { sendInternalError, sendValidationError } from '../utils/httpResponses.js';

const router = Router();

const replyReviewSchema = z.object({
  reply: z.string().min(1).max(1000)
});

router.post('/:id/reply', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const validated = replyReviewSchema.parse(req.body);
    const userId = req.user!.id;

    const review = await prisma.counselorReview.findUnique({
      where: { id },
      include: { appointment: true }
    });

    if (!review) {
      return res.status(404).json({ error: '评价不存在' });
    }

    if (review.counselorId !== userId) {
      return res.status(403).json({ error: '只有被评价的咨询师可以回复' });
    }

    if (review.reply) {
      return res.status(400).json({ error: '该评价已回复过，不能重复回复' });
    }

    const updatedReview = await prisma.counselorReview.update({
      where: { id },
      data: {
        reply: validated.reply,
        repliedAt: new Date()
      }
    });

    await prisma.notification.create({
      data: {
        userId: review.clientId,
        type: 'REVIEW_REPLY',
        title: '咨询师回复了您的评价',
        content: `咨询师回复了您对咨询「${review.appointment.title}」的评价`,
        relatedId: review.id
      }
    });

    res.json({
      message: '回复成功',
      review: updatedReview
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendValidationError(res, error);
    }
    sendInternalError(res, error, '回复评价错误', '回复评价失败');
  }
});

export default router;
