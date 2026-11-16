import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const SupportChatButton = () => {
  return (
    <div className="fixed bottom-6 right-6 z-[70]">
      <Button asChild className="h-12 rounded-full px-5 shadow-lg">
        <a
          href="https://wa.me/6283172492050"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
        >
          <MessageCircle className="h-5 w-5" />
          <span>Chat</span>
        </a>
      </Button>
    </div>
  );
};

export default SupportChatButton;
