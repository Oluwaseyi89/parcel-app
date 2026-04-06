export default function PlaceholderPage({ title, summary, bullets }) {
  return (
    <div className="placeholder">
      <h2>{title}</h2>
      <p>{summary}</p>
      <ul>
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </div>
  )
}
