import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
// 1. Import ข้อมูลโมเดลเข้ามาใช้
import { appleModels } from './appleModels';
import './info-style.css';

export default function UdidInfo() {
  const [udidText, setUdidText] = useState('');
  const [modelName, setModelName] = useState(''); // เก็บชื่อรุ่น Apple
  const [targetUDID, setTargetUDID] = useState('N/A');
  const [isCopying, setIsCopying] = useState(false);
  const [isScrambling, setIsScrambling] = useState(true);

  const isScramblingRef = useRef(true);
  const isCopyingRef = useRef(false);

  useEffect(() => {
    isScramblingRef.current = isScrambling;
  }, [isScrambling]);

  useEffect(() => {
    isCopyingRef.current = isCopying;
  }, [isCopying]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let encodedData = urlParams.get('data');

    if (!encodedData && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      encodedData = hashParams.get('data');
    }

    let deviceData = null;

    if (encodedData) {
      try {
        const jsonString = atob(decodeURIComponent(encodedData));
        deviceData = JSON.parse(jsonString);

        localStorage.setItem('udid_device_backup', JSON.stringify(deviceData));

        if (window.history.replaceState) {
          window.history.replaceState(null, null, '/udid-info#data=' + encodeURIComponent(encodedData));
        }
      } catch (e) {
        console.error('Decode Error:', e);
      }
    } else {
      const backup = localStorage.getItem('udid_device_backup');
      if (backup) {
        try {
          deviceData = JSON.parse(backup);
        } catch (e) {
          console.error('Backup Parse Error:', e);
        }
      }
    }

    const finalUDID = deviceData && deviceData.udid ? deviceData.udid : 'N/A';
    setTargetUDID(finalUDID);

    // 2. ดึงชื่อรุ่น Apple จาก appleModels ตามรหัส PRODUCT (เช่น "iPhone14,2")
    if (deviceData && deviceData.product) {
      const matchedModel = appleModels[deviceData.product] || deviceData.product;
      setModelName(matchedModel);
    }

    if (finalUDID === 'N/A') {
      setUdidText('N/A');
      setIsScrambling(false);
      return;
    }

    setIsScrambling(true);
    const chars = '0123456789ABCDEF';
    const obj = { progress: 0 };

    const tween = gsap.to(obj, {
      progress: 1,
      duration: 2.5,
      ease: 'power1.inOut',
      onUpdate: () => {
        const revealedLength = Math.floor(obj.progress * finalUDID.length);
        let result = finalUDID.substring(0, revealedLength);

        for (let i = revealedLength; i < finalUDID.length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setUdidText(result);
      },
      onComplete: () => {
        setIsScrambling(false);
      }
    });

    return () => {
      tween.kill();
    };
  }, []);

  const handleCopy = () => {
    if (isCopyingRef.current || isScramblingRef.current || targetUDID === 'N/A') return;

    setIsCopying(true);

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(targetUDID);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = targetUDID;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    setUdidText('Copied to clipboard');

    setTimeout(() => {
      setUdidText(targetUDID);
      setIsCopying(false);
    }, 1500);
  };

  return (
    <div className="wrapper">
      <div className="title-container">
        <div className="title">UDID info</div>
        {/* 3. นำชื่อรุ่นที่แมตช์ได้มาแสดงผล */}
        {modelName && <div className="device-model">{modelName}</div>}
      </div>

      <div className="terminal-box" id="terminalBox" onClick={handleCopy}>
        <span className="udid-text" id="udidText">
          {udidText}
        </span>
      </div>
    </div>
  );
}
