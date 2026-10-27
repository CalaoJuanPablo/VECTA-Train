import s from './NotFoundPage.module.css';

export const NotFoundPage = () => (
  <div className={s.root}>
    <div className={s.content}>
      <h1 className={s.title}>Page not found</h1>
      <p className={s.message}>The page you're looking for doesn't exist.</p>
    </div>
  </div>
);
