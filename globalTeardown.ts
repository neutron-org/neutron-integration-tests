import ch from 'child_process';

export default () => {
  !process.env.NO_DOCKER && ch.execSync(`cd setup && make stop-cosmopark`);
};
