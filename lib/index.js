const fs = require("fs");
const { exec } = require("child_process");
const tempFile = require("temp-write");
const shell = require("shelljs");

const createTempFile = async (content) => {
  return await tempFile(content, "temp.m");
};

const hasMATLAB = () => {
  return !shell.which("matlab");
};

/**
 * Checks MATLAB version
 * @returns {number} version
 */
const getVersion = () => {
  return new Promise((resolve, reject) => {
    if (hasMATLAB()) {
      throw "You must have MATLAB installed";
    }
    
    exec(`matlab -help`, (error, stdout, stderr) => {
      let version = stdout
        .trim()
        .split("\r\n")
        .reverse()[0]
        .trim()
        .match(/Version:(.*),/)[1]
        .trim()
        .split(".");

      version.length -= 1;

      if (version[0].length === 1) {
        version[0] = "0" + version[0];
      }
      if (version[1].length === 1) {
        version[1] = "0" + version[1];
      }

      version = parseFloat(version.join(".")).toFixed(2);

      if (version < 9.06) {
        reject("You must have installed MATLAB 2019a or later");
      }

      resolve(version);
    });
  });
};

/**
 * Runs MATLAB script and gives output
 * @param {string} ml_function Runnable Script
 * @param {array} paths paths to add for matlab
 * @returns {string} result
 */
const run = async (ml_function, paths) => {
  try {
    if (hasMATLAB()) {
      return "You must have MATLAB installed";
    }
    let version = await getVersion();
    if (version) { // Valid version -> continue

      let path_cmd = ""
      for (let i = 0; i < paths.length; i++) {
        path_cmd += paths[i] + ";"
      }

      return new Promise((resolve, reject) => {
        exec(
          `set MATLABPATH=${path_cmd} && matlab -nosplash -noFigureWindows -batch "run('${ml_function}');exit;"`,
          (error, stdout, stderr) => {
            if (error) {
              reject(stderr.trim());
            }
            resolve(
              stdout
                .replace("ans =\r\n\r\n", "")
                .trim()
                .replace(/\\n/g, "\n")
                .trim()
            );
          }
        );
      });
    }
  } catch (error) {
    return error;
  }
};

module.exports = {
  run,
  getVersion,
};
