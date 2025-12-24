import express, { Request, Response } from 'express';
import { check } from 'express-validator';
import { emailIsUnique, setCurrentUserURLToken, emailToLowerCase } from '../middlewares/auth';
import { fieldValidator } from '../middlewares/field-validator';
import sendConfirmAccountEmail = require('../mailers/confirm-account');
import { generateToken } from '../utils/jwt';
import '../types/express'; // Import for global type extension

const router = express.Router();
router.use(emailToLowerCase);

router.post('/register', [
  check('password', 'password should be at least 6 characters long').isLength({ min: 6 }),
  check('firstName', 'firstName should be at least 2 characters long').isLength({ min: 2 }),
  check('lastName', 'lastName should be at least 2 characters long').isLength({ min: 2 }),
  check('email', 'email format is not valid').isEmail(),
  fieldValidator,
], emailIsUnique, async (req: Request, res: Response) => {
  console.log(`Registering new user with email ${req.body.email}`);
  try {
    const [user] = await req.orm.User.findOrCreate({
      where: { email: req.body.email },
      defaults: {
        ...req.body,
      },
    });
    console.log(`User with email ${user.email} created with id ${user.id}`);
    const token = generateToken(user.id);
    await sendConfirmAccountEmail(user, token);
    console.log(`Confirmation email sent to ${user.email}`);
    return res.status(201).send({ message: 'User was successfully created' });
  } catch (error) {
    const err = error as Error;
    console.error(`Error registering user - ${err.message}`);
    return res.status(500).send();
  }
});

router.post('/login', [
  check('password', 'password should be at least 6 characters long').isLength({ min: 6 }),
  check('email', 'email format is not valid').isEmail(),
  fieldValidator,
], async (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log(`Login attempt for ${email}`);
  const user = await req.orm.User.findOne({ where: { email, active: true } });
  if (!user) {
    console.log(`Login failed - no user found with ${email}`);
    return res.status(404).send({ message: `No user found with ${email}` });
  }
  const authenticated = await user.checkPassword(password);
  if (!authenticated) {
    console.log(`Login failed - invalid password for ${email}`);
    return res.status(401).send({ message: 'Invalid password' });
  }

  try {
    const token = generateToken(user.id);
    console.log(`Login successful for ${email}`);
    return res.status(201).send({ access_token: token, tokenType: 'Bearer' });
  } catch (error) {
    const err = error as Error;
    console.error(`Error generating JWT for ${email} - ${err.message}`);
    return res.status(500).send({ message: 'Error generating the jwt' });
  }
});

router.get('/confirmation/:token', setCurrentUserURLToken, async (req: Request, res: Response) => {
  console.log(`Confirming account for user ${req.currentUser!.email}`);
  try {
    req.currentUser!.active = true;
    await req.currentUser!.save();
    console.log(`Account confirmed successfully for ${req.currentUser!.email}`);
    return res.redirect(`${process.env.CONFIRMATION_ACCOUNT_REDIRECT_URL}confirmation-success`);
  } catch (error) {
    const err = error as Error;
    console.error(`Error confirming account - ${err.message}`);
    return res.redirect(`${process.env.CONFIRMATION_ACCOUNT_REDIRECT_URL}invalid`);
  }
});

router.get('/desconfirmation/:token', setCurrentUserURLToken, async (req: Request, res: Response) => {
  console.log(`Desconfirming account for user ${req.currentUser!.email}`);
  try {
    await req.currentUser!.destroy();
    console.log(`Account deleted for ${req.currentUser!.email}`);
    return res.redirect(`${process.env.CONFIRMATION_ACCOUNT_REDIRECT_URL}desconfirmation-success`);
  } catch (error) {
    const err = error as Error;
    console.error(`Error deleting account - ${err.message}`);
    return res.redirect(`${process.env.CONFIRMATION_ACCOUNT_REDIRECT_URL}invalid`);
  }
});

export = router;
