export function Brand({ admin = false }: { admin?: boolean }) {
  return (
    <>
      <span className='jd-logo-mark' aria-hidden='true'>
        JD
      </span>
      <span className='app-brand-name'>
        Just<span>Dial</span>
      </span>
      {admin && <span className='app-brand-tag'>ADMIN</span>}
    </>
  );
}
