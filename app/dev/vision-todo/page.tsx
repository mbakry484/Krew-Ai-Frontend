import VisionTodo from '@/components/vision/VisionTodo';

// Dev-only harness (like /dev/agents): renders the Today-list section alone so
// its layout/overlay fit can be verified in a headless screenshot without
// scrolling past the films hero. Not linked from anywhere.
export default function VisionTodoDevPage() {
  return (
    <div className="min-h-screen bg-background">
      <VisionTodo />
    </div>
  );
}
