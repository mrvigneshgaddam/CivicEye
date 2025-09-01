// const User = require('../models/User');
// const Police = require('../models/Police');
// const jwt = require('jsonwebtoken');

// exports.login = async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         // Check if the user exists
//         const user = await User.findOne({ email, password });
//         if (user) {
//             const token = jwt.sign(
//                 { id: user._id, type: 'user' }, 
//                 process.env.JWT_SECRET, 
//                 { expiresIn: '8h' }
//             );
//             return res.status(200).json({ 
//                 type: 'user', 
//                 data: user,
//                 token 
//             });
//         }

//         // Check if the police officer exists
//         const police = await Police.findOne({ email, password });
//         if (police) {
//             const token = jwt.sign(
//                 { id: police._id, type: 'police' }, 
//                 process.env.JWT_SECRET, 
//                 { expiresIn: '8h' }
//             );
//             return res.status(200).json({ 
//                 type: 'police', 
//                 data: police,
//                 token 
//             });
//         }

//         res.status(404).send('Invalid credentials');
//     } catch (error) {
//         res.status(500).send(error.message);
//     }
// };

// exports.getProfile = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { type } = req.user; // From JWT middleware

//         if (type === 'user') {
//             const user = await User.findById(id);
//             if (!user) return res.status(404).send('User not found');
//             return res.status(200).json(user);
//         } else if (type === 'police') {
//             const police = await Police.findById(id);
//             if (!police) return res.status(404).send('Police not found');
//             return res.status(200).json(police);
//         }

//         res.status(400).send('Invalid user type');
//     } catch (error) {
//         res.status(500).send(error.message);
//     }
// };

// exports.verifyToken = async (req, res) => {
//     try {
//         const token = req.header('Authorization')?.replace('Bearer ', '');
//         if (!token) return res.status(401).json(false);
        
//         const verified = jwt.verify(token, process.env.JWT_SECRET);
//         if (!verified) return res.status(401).json(false);

//         const user = verified.type === 'user' 
//             ? await User.findById(verified.id)
//             : await Police.findById(verified.id);

//         if (!user) return res.status(401).json(false);

//         return res.status(200).json({
//             type: verified.type,
//             data: user,
//             token
//         });
//     } catch (error) {
//         res.status(500).json(false);
//     }
// };


const User = require('../models/User');
const Police = require('../models/Police');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the user exists
        const user = await User.findOne({ email, password });
        if (user) {
            const token = jwt.sign(
                { id: user._id, type: 'user' }, 
                process.env.JWT_SECRET, 
                { expiresIn: '8h' }
            );
            return res.status(200).json({ 
                type: 'user', 
                data: user,
                token 
            });
        }

        // Check if the police officer exists
        const police = await Police.findOne({ email, password });
        if (police) {
            const token = jwt.sign(
                { id: police._id, type: 'police' }, 
                process.env.JWT_SECRET, 
                { expiresIn: '8h' }
            );
            return res.status(200).json({ 
                type: 'police', 
                data: police,
                token 
            });
        }

        res.status(404).send('Invalid credentials');
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email, userType } = req.body;
    
    let user;
    if (userType === 'user') {
      user = await User.findOne({ email });
    } else if (userType === 'police') {
      user = await Police.findOne({ email });
    } else {
      return res.status(400).json({ 
        status: 'fail', 
        message: 'Please specify user type (user or police)' 
      });
    }

    if (!user) {
      return res.status(404).json({ 
        status: 'fail', 
        message: 'No account found with that email address' 
      });
    }

    // Generate reset token (JWT)
    const resetToken = jwt.sign(
      { id: user._id, type: userType },
      process.env.JWT_SECRET,
      { expiresIn: '10m' } // Token expires in 10 minutes
    );

    // Save the token to the user document
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes from now
    
    if (userType === 'user') {
      await user.save({ validateBeforeSave: false });
    } else {
      await user.save({ validateBeforeSave: false });
    }

    // Send email with reset link
    // const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
    const resetURL = `http://localhost:5000/reset-password/${resetToken}`;

    
    const mailOptions = {
      from: 'CivicEye <noreply@civiceye.com>',
      to: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      html: `
        <h2>CivicEye Password Reset</h2>
        <p>You requested a password reset. Please click the button below to reset your password:</p>
        <a href="${resetURL}" style="
          display: inline-block;
          padding: 10px 20px;
          background-color: #3b82f6;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 10px 0;
        ">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
        <p><strong>Note:</strong> This link will expire in 10 minutes.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });

  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'There was an error sending the email. Try again later!'
    });
  }
};

// exports.resetPassword = async (req, res) => {
//   try {
//     // 1. Get token from URL and verify it
//     const token = req.params.token;
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // 2. Find user by token
//     let user;
//     if (decoded.type === 'user') {
//       user = await User.findOne({
//         _id: decoded.id,
//         passwordResetToken: token,
//         passwordResetExpires: { $gt: Date.now() }
//       });
//     } else if (decoded.type === 'police') {
//       user = await Police.findOne({
//         _id: decoded.id,
//         passwordResetToken: token,
//         passwordResetExpires: { $gt: Date.now() }
//       });
//     }

//     if (!user) {
//       return res.status(400).json({
//         status: 'fail',
//         message: 'Token is invalid or has expired'
//       });
//     }
exports.resetPassword = async (req, res) => {
  try {
    const token = req.params.token;
    console.log("Token received:", token); // Debug token

    // 1. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded token:", decoded); // Debug decoded data
    } catch (err) {
      console.error("JWT Verification Error:", err.message);
      return res.status(400).json({ 
        status: 'fail', 
        message: 'Token is invalid or expired' 
      });
    }

    // 2. Find user
    let user;
    if (decoded.type === 'user') {
      user = await User.findOne({
        _id: decoded.id,
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() }
      });
    } else {
      user = await Police.findOne({
        _id: decoded.id,
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() }
      });
    }

    if (!user) {
      console.error("User not found or token expired");
      return res.status(400).json({ 
        status: 'fail', 
        message: 'Token is invalid or expired' 
      });
    }

    // 3. Update password
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    // 3. Update password
    // user.password = req.body.password;
    // user.passwordResetToken = undefined;
    // user.passwordResetExpires = undefined;
    
    if (decoded.type === 'user') {
      await user.save({ validateBeforeSave: false });
    } else {
      await user.save({ validateBeforeSave: false });
    }

    // 4. Send confirmation email
    const mailOptions = {
      from: 'CivicEye <noreply@civiceye.com>',
      to: user.email,
      subject: 'Your password has been changed',
      html: `
        <h2>Password Changed Successfully</h2>
        <p>Your CivicEye account password has been successfully updated.</p>
        <p>If you didn't make this change, please contact support immediately.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully!'
    });

  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.getProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.user; // From JWT middleware

        if (type === 'user') {
            const user = await User.findById(id);
            if (!user) return res.status(404).send('User not found');
            return res.status(200).json(user);
        } else if (type === 'police') {
            const police = await Police.findById(id);
            if (!police) return res.status(404).send('Police not found');
            return res.status(200).json(police);
        }

        res.status(400).send('Invalid user type');
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.verifyToken = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json(false);
        
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (!verified) return res.status(401).json(false);

        const user = verified.type === 'user' 
            ? await User.findById(verified.id)
            : await Police.findById(verified.id);

        if (!user) return res.status(401).json(false);

        return res.status(200).json({
            type: verified.type,
            data: user,
            token
        });
    } catch (error) {
        res.status(500).json(false);
    }
};