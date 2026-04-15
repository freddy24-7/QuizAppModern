const Footer = () => {
  return (
    <footer className="w-full border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} QuizGenerator</p>
      </div>
    </footer>
  );
};

export default Footer;
