import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import {
  createArtifact,
  getUserArtifacts,
  getArtifactById,
  getArtifactConditions,
  transitionArtifactState,
  createAuditLog
} from '../services/artifact.service';
import { ArtifactCategory, ConditionType, ArtifactState } from '../models/types';
import { satisfyBehaviorCondition } from '../services/condition-evaluator.service';
import { stateEngine } from '../services/state-engine.service';
import { isValidObjectId } from '../utils/serialize';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const artifacts = await getUserArtifacts(req.userId!);
    res.json(artifacts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const artifactId = req.params.id;
    if (!isValidObjectId(artifactId)) {
      return res.status(400).json({ error: 'Invalid artifact ID' });
    }

    const artifact = await getArtifactById(artifactId, req.userId!);

    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    res.json(artifact);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  '/',
  [
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('content').trim().isLength({ min: 1 }),
    body('category').isIn(Object.values(ArtifactCategory)),
    body('conditions').isArray().isLength({ min: 1 }),
    body('conditions.*.condition_type').isIn(Object.values(ConditionType)),
    body('conditions.*.condition_data').isObject()
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, content, category, conditions } = req.body;

      const artifact = await createArtifact(req.userId!, {
        title,
        content,
        category,
        conditions
      });

      await createAuditLog(req.userId!, artifact.id, 'artifact_created', {
        title,
        category,
        condition_count: conditions.length
      });

      res.status(201).json(artifact);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.get('/:id/conditions', async (req: AuthRequest, res: Response) => {
  try {
    const artifactId = req.params.id;
    if (!isValidObjectId(artifactId)) {
      return res.status(400).json({ error: 'Invalid artifact ID' });
    }

    const artifact = await getArtifactById(artifactId, req.userId!);
    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    const conditions = await getArtifactConditions(artifactId);
    res.json(conditions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  '/:id/satisfy-condition',
  [body('condition_id').notEmpty().withMessage('condition_id is required')],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const artifactId = req.params.id;
      const conditionId = req.body.condition_id;

      if (!isValidObjectId(artifactId) || !isValidObjectId(conditionId)) {
        return res.status(400).json({ error: 'Invalid artifact or condition ID' });
      }

      const artifact = await getArtifactById(artifactId, req.userId!);
      if (!artifact) {
        return res.status(404).json({ error: 'Artifact not found' });
      }

      await satisfyBehaviorCondition(conditionId, artifactId);
      await createAuditLog(req.userId!, artifactId, 'condition_satisfied', { conditionId });

      await stateEngine.evaluateArtifact(artifactId);

      res.json({ message: 'Condition satisfied' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post(
  '/:id/transition',
  [
    body('new_state').isIn(Object.values(ArtifactState)),
    body('reason').trim().isLength({ min: 1 }),
    body('transformed_content').optional().isString()
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const artifactId = req.params.id;
      if (!isValidObjectId(artifactId)) {
        return res.status(400).json({ error: 'Invalid artifact ID' });
      }

      const { new_state, reason, transformed_content } = req.body;

      const artifact = await getArtifactById(artifactId, req.userId!);
      if (!artifact) {
        return res.status(404).json({ error: 'Artifact not found' });
      }

      if (artifact.state !== ArtifactState.VISIBLE) {
        return res.status(400).json({
          error: 'Manual transitions only allowed from visible state'
        });
      }

      const updatedArtifact = await transitionArtifactState(
        artifactId,
        new_state,
        reason,
        'user',
        transformed_content
      );

      await createAuditLog(req.userId!, artifactId, 'manual_state_transition', {
        from: artifact.state,
        to: new_state,
        reason
      });

      res.json(updatedArtifact);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;
