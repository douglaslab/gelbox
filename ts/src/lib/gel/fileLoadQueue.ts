/** Native loads files synchronously. Serialize browser reads across Open and Drop. */
export class FileLoadQueue {
  private tail: Promise<void> = Promise.resolve();
  private generation = 0;
  private active = true;

  activate() { this.active = true; }
  dispose() {
    this.active = false;
    ++this.generation;
    this.tail = Promise.resolve();
  }

  run(operation: (isCurrent: () => boolean) => Promise<void>): Promise<void> {
    if (!this.active) return Promise.resolve();
    const generation = this.generation;
    const isCurrent = () => this.active && generation === this.generation;
    const job = this.tail.then(async () => {
      if (isCurrent()) await operation(isCurrent);
    });
    this.tail = job.catch(() => {});
    return job;
  }
}
