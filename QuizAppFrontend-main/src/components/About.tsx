import React from 'react';
import { Modal } from './ui/modal';
import { Accordion } from './ui/accordion';

interface AboutProps {
  isOpen: boolean;
  onClose: () => void;
}

const About: React.FC<AboutProps> = ({ isOpen, onClose }) => {
  const accordionItems = [
    {
      title: 'Background',
      content: (
        <div className="space-y-4 text-muted-foreground text-sm">
          <p>
            QuizApp was created as a demonstration project to showcase the integration of modern web technologies:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>A React Vite frontend for blazing-fast development and optimal performance</li>
            <li>A Spring Boot backend demonstrating enterprise-grade Java capabilities</li>
            <li>Real-world features like QR code joining and real-time updates</li>
          </ul>
          <p className="mt-4">
            The application serves as a practical example of full-stack development using Java and React.
            Users can easily test the entire system by creating quizzes.
          </p>
        </div>
      ),
    },
    {
      title: 'How to Use',
      content: (
        <div className="space-y-4 text-muted-foreground text-sm">
          <p>QuizApp allows you to create and participate in interactive quizzes:</p>
          <p className="font-medium text-foreground">Option A: Create manually</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Choose &quot;Create Manually&quot; from the home page</li>
            <li>Set a quiz title and duration</li>
            <li>Write your own questions with multiple-choice answers</li>
            <li>Create the quiz and show the QR code to your players</li>
          </ol>
          <p className="font-medium text-foreground mt-3">Option B: Generate with AI</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Choose &quot;Generate with AI&quot; from the home page</li>
            <li>Enter a topic (e.g. &quot;The Solar System&quot;) and pick how many questions</li>
            <li>AI generates the quiz using Google Gemini — review and edit as needed</li>
            <li>Create the quiz and show the QR code to your players</li>
          </ol>
          <p className="mt-3">
            Participants scan the QR code and enter a name to join the lobby. The quiz starts when the host clicks Start.
          </p>
        </div>
      ),
    },
    {
      title: 'Backend Tech Stack',
      content: (
        <div className="space-y-4 text-muted-foreground text-sm">
          <p>The backend is built with:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Java 17+</li>
            <li>Spring Boot</li>
            <li>Spring Data JPA (Hibernate)</li>
            <li>H2/PostgreSQL (configurable)</li>
            <li>Lombok</li>
            <li>Maven</li>
          </ul>
          <p className="mt-4 font-medium">Key Features:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Create quizzes with questions and answer options</li>
            <li>Participants join with a name via a QR code link</li>
            <li>Record and update user responses</li>
            <li>Automatically close quizzes after timeout</li>
            <li>Track quiz progress (per user)</li>
            <li>View quiz results with scores and metadata</li>
            <li>RESTful API for frontend integration</li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Frontend Tech Stack',
      content: (
        <div className="space-y-4 text-muted-foreground text-sm">
          <p>The frontend is built with:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>React 19 + TypeScript</li>
            <li>Vite 6</li>
            <li>Tailwind CSS v4</li>
            <li>React Router</li>
            <li>Google Gemini API (AI quiz generation)</li>
            <li>Vitest + React Testing Library</li>
          </ul>
          <p className="mt-4 font-medium">Key Features:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>AI-powered quiz generation from any topic</li>
            <li>Manual quiz creation with inline validation</li>
            <li>QR code lobby — the host starts the quiz once players have joined</li>
            <li>Real-time quiz participation with countdown timer</li>
            <li>Live result tracking with score distribution</li>
          </ul>
        </div>
      ),
    },
    {
      title: 'GitHub',
      content: (
        <div className="space-y-4 text-muted-foreground text-sm">
          <p>The full project (frontend + backend) lives in a single repository:</p>
          <a
            href="https://github.com/freddy24-7/QuizAppModern"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline break-all"
          >
            github.com/freddy24-7/QuizAppModern
          </a>
        </div>
      ),
    },
    {
      title: 'Other Info',
      content: (
        <div className="space-y-4 text-muted-foreground text-sm">
          <div className="space-y-2">
            <p className="font-medium">Joining a Quiz:</p>
            <p>No phone numbers are collected. Players scan the QR code on the host&apos;s screen, enter a name, and wait in the lobby until the host starts the quiz.</p>
          </div>
          <div className="space-y-2">
            <p className="font-medium">Data Privacy & Automatic Cleanup:</p>
            <p>
              Quiz data is not stored permanently. Once results have been displayed, all quiz data — including questions, participant names, and responses — is automatically deleted from the backend when the quiz creator leaves the results page (by navigating away, closing the tab, or refreshing).
            </p>
            <p>
              This means the app requires a live backend deployment to function correctly. Running the app only on localhost is insufficient for full use, as the QR code must point to an address that participants&apos; phones can reach. The backend must be deployed to a service such as Railway.
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="About QuizApp"
      subtitle="Learn more about our quiz application"
    >
      <div className="mt-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-muted">
        <Accordion items={accordionItems} />
      </div>
    </Modal>
  );
};

export default About; 