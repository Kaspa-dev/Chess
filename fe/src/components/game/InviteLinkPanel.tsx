import { Button } from "@heroui/button";

interface InviteLinkPanelProps {
  shareableLink: string;
  onCopy: () => void;
}

export function InviteLinkPanel({ shareableLink, onCopy }: InviteLinkPanelProps) {
  if (!shareableLink) {
    return null;
  }

  return (
    <div className="my-4 flex flex-row items-center align-center gap-x-4">
      <p>Share this link to invite a player:</p>
      <input type="text" value={shareableLink} readOnly className="border p-2 w-full" />
      <Button
        size="sm"
        radius="lg"
        className="font-semibold text-white shadow-lg bg-gradient-to-tr from-stone-700 to-green-500"
        onPress={onCopy}
      >
        Copy Link
      </Button>
    </div>
  );
}
