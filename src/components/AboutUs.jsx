import React from 'react';
import './AboutUs.css';

function AboutUs() {
  const highlights = [
    {
      title: 'Community Discovery',
      desc: 'Explore worlds, creators, and trends in a visual feed designed for quick browsing.'
    },
    {
      title: 'Creator Profiles',
      desc: 'Manage your identity, posts, likes, and saves with a profile-first experience.'
    },
    {
      title: 'Backend Migration Ready',
      desc: 'The frontend is being prepared to switch from local demo data to production APIs.'
    }
  ];

  return (
    <section className="about-page">
      <div className="about-card">
        <h1>About MadNote</h1>
        <p>
          MadNote is a community content platform inspired by modern visual social apps. The
          current build focuses on UX and interaction polish while we migrate data flows from
          demo/local storage to a real backend.
        </p>
        <div className="about-grid">
          {highlights.map((item) => (
            <article className="about-item" key={item.title}>
              <h2>{item.title}</h2>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AboutUs;
