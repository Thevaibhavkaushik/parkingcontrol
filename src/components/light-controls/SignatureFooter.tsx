const SignatureFooter = () => {
  return (
    <footer
      className="mt-auto flex flex-col items-center px-5 pb-8 pt-14 text-center"
      style={{ animation: "fadeInUp 0.6s 0.65s both ease-out" }}
    >
      <div className="footer-divider mb-5" />
      <p className="signature-label">Designed &amp; Developed by</p>
      <h2 className="signature-name">Vaibhav Kaushik</h2>
    </footer>
  );
};

export default SignatureFooter;