export default function UIWrapper({ title, subtitle, right, children }) {
  return (
    <div className="container">
      <div className="header">
        <div>
          <h1 className="title">{title}</h1>
          {subtitle ? <p className="subtitle">{subtitle}</p> : null}
        </div>
        <div className="row">{right}</div>
      </div>
      <div className="panel">
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

