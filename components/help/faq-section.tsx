import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How do I create a new workspace?",
    answer:
      "To create a new workspace, go to the dashboard and click on the 'Create Workspace' button in the top right corner. Follow the prompts to set up your new workspace.",
  },
  {
    question: "Can I invite team members?",
    answer:
      "Yes, you can invite team members by navigating to the 'Team' section in your dashboard. Click 'Invite Member' and enter their email address.",
  },
  {
    question: "How do I change my password?",
    answer:
      "You can change your password in the 'Settings' page. Go to 'Account' and look for the 'Change Password' section.",
  },
  {
    question: "Where can I find my billing invoices?",
    answer:
      "Billing invoices are available in the 'Settings' page under the 'Billing' tab. You can view and download your past invoices there.",
  },
];

export function FAQSection() {
  return (
    <div className="w-full max-w-3xl">
      <h2 className="mb-6 text-2xl font-semibold tracking-tight">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
