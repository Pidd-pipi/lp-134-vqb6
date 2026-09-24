import { Router } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { sendInternalError, sendValidationError } from '../utils/httpResponses.js';

const router = Router();

const createReviewSchema = z.object({
  appointmentId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(1).max(1000),
  isAnonymous: z.boolean().optional().default(false)
});

const replyReviewSchema = z.object({
  reply: z.string().min(1).max(1000)
});

// 提交咨询评价（来访者，仅已完成的预约，每个预约限一次，提交后不可修改）
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const validated = createReviewSchema.parse(req.body);
    const userId = req.user!.id;

    const appointment = await prisma.appointment.findUnique({
      where: { id: validated.appointmentId },
      include: { review: true }
    });

    if (!appointment) {
      return res.status(404).json({ error: '预约不存在' });
    }

    if (appointment.clientId !== userId) {
      return res.status(403).json({ error: '只能评价自己的咨询预约' });
    }

    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({ error: '已取消的预约无法评价' });
    }

    if (appointment.status !== 'COMPLETED') {
      return res.status(400).json({ error: '咨询完成后才能评价' });
    }

    if (appointment.review) {
      return res.status(409).json({ error: '该预约已提交过评价，不能重复提交' });
    }

    const review = await prisma.review.create({
      data: {
        appointmentId: appointment.id,
        clientId: userId,
        counselorId: appointment.counselorId,
        rating: validated.rating,
        content: validated.content,
        isAnonymous: validated.isAnonymous
      }
    });

    await prisma.notification.create({
      data: {
        userId: appointment.counselorId,
        type: 'NEW_REVIEW',
        title: '收到新的咨询评价',
        content: `您收到一条 ${validated.rating} 星评价，快去查看并回复吧`,
        relatedId: review.id
      }
    });

    res.json({
      message: '评价提交成功',
      review
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendValidationError(res, error);
    }
    sendInternalError(res, error, '提交评价错误', '提交评价失败');
  }
});

// 咨询师回复评价（仅限一次，回复公开显示）
router.post('/:id/reply', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const validated = replyReviewSchema.parse(req.body);
    const userId = req.user!.id;

    const review = await prisma.review.findUnique({
      where: { id }
    });

    if (!review) {
      return res.status(404).json({ error: '评价不存在' });
    }

    if (review.counselorId !== userId) {
      return res.status(403).json({ error: '只有被评价的咨询师可以回复' });
    }

    if (review.reply) {
      return res.status(409).json({ error: '该评价已回复过，不能重复回复' });
    }

    const updatedReview = await prisma.review.update({
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
        content: '咨询师对您的咨询评价作出了回复，快去查看吧',
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
