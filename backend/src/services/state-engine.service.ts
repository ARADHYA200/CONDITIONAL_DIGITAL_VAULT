import cron from 'node-cron';
import { Artifact, ArtifactState } from '../models/Artifact';
import { evaluateArtifactConditions } from './condition-evaluator.service';

class StateEngine {
  private isRunning: boolean = false;

  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    console.log('State Engine started');

    cron.schedule('* * * * *', async () => {
      await this.evaluateAllArtifacts();
    });

    this.evaluateAllArtifacts();
  }

  stop(): void {
    this.isRunning = false;
    console.log('State Engine stopped');
  }

  private async evaluateAllArtifacts(): Promise<void> {
    try {
      const artifacts = await Artifact.find({ state: { $ne: ArtifactState.DESTROYED } });

      for (const artifact of artifacts) {
        try {
          await evaluateArtifactConditions(artifact._id.toString());
        } catch (error) {
          console.error(`Error evaluating artifact ${artifact._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in state engine evaluation:', error);
    }
  }

  async evaluateArtifact(artifactId: string): Promise<void> {
    await evaluateArtifactConditions(artifactId);
  }
}

export const stateEngine = new StateEngine();
