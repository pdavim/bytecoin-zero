// Copyright 2019 The Bytecoin developers.
// Licensed under the GNU Affero General Public License, version 3.

import React, { useState, useEffect } from "react";
import { generateMnemonic, validateMnemonic } from "bip39";
import {
  checkAddressFormat,
  checkAuditFormat,
  auditPattern
} from "@bcndev/bytecoin";
import englishWordlist from "bip39/src/wordlists/english.json";
import Avatar from "./Avatar";
import * as util from "./lib/util";
import * as sync from "./lib/sync";
import logo from "./img/logo.svg";
import styles from "./css/OpenForm.module.css";

//react bootstrap elements
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import Image from "react-bootstrap/Image";


interface IWalletInstanceInfo {
  readonly firstAddress: string;
  readonly filename: string;
  readonly viewOnly: boolean;
  readonly lastOpen: number;
}

const OpenForm = React.memo(
  (props: {
    onOpen: (
      isFile: boolean,
      desc: string,
      isNew: boolean,
      viewOnly: boolean
    ) => void;
  }) => {
    const [description, setDescription] = useState("");
    const [genDescription, setGenDescription] = useState("");
    const [descriptionValid, setDescriptionValid] = useState(false);
    const [opening, setOpening] = useState(false);
    const [existingWallets, setExistingWallets] = useState<
      IWalletInstanceInfo[]
    >([]);

    useEffect(() => {
      const w: IWalletInstanceInfo[] = [];

      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i) || "";
        const addr = key.substring("wallet.".length);
        if (checkAddressFormat(addr)) {
          const info: sync.IAddressWalletsInfo = JSON.parse(
            window.localStorage.getItem(key) || "{}"
          );
          const wInfo: IWalletInstanceInfo[] = [];
          for (let filename in info) {
            if (info.hasOwnProperty(filename)) {
              wInfo.push({
                firstAddress: addr,
                filename,
                viewOnly: info[filename].viewOnly,
                lastOpen: info[filename].lastOpen
              });
            }
          }
          w.push(...wInfo);
        }
      }

      w.sort((a, b) => a.lastOpen - b.lastOpen);
      setExistingWallets(w.reverse());
    }, []);

    const generate = () => {
      let desc = generateMnemonic(256, undefined, englishWordlist);
      setDescription(desc);
      setGenDescription(desc);
      setDescriptionValid(true);
    };

    const open = async (
      isFile: boolean,
      desc: string,
      isNew: boolean,
      viewOnly: boolean
    ) => {
      if (opening) {
        return;
      }

      setOpening(true);
      props.onOpen(isFile, desc, isNew, viewOnly);
      setOpening(false);
    };

    return (
      <div className={styles.openForm}>
        <div className={styles.logo}>
          <Image
            className={styles.figure}
            src={logo}
            alt="Bytecoin"
            width={171}
            height={180}
          />
        </div>

        <div className={styles.fromDescription}>
          <InputGroup className={styles.descGroup}>
            <FormControl
              as="textarea"
              aria-label="With textarea"
              className={`${descriptionValid ? "valid" : "invalid"}`}
              placeholder="Bytecoin BIP39 mnemonic or an audit secret"
              rows={7}
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              maxLength={512}
              value={description}
              onChange={(event: React.ChangeEvent<FormControl>) => {
                const castEvent = (event as unknown) as React.ChangeEvent<
                  HTMLInputElement
                >;
                const desc = castEvent.target.value;
                const audit = auditPattern.test(desc.trim());
                const ok = audit
                  ? checkAuditFormat(desc.trim())
                  : validateMnemonic(
                      desc.trim().toLowerCase(),
                      englishWordlist
                    );
                setDescriptionValid(ok);
                setDescription(desc);
                //setValue(castEvent.target.value);
                console.log(castEvent.target.value);
              }}
            />
          </InputGroup>

          <div className={styles.controls}>
            <Button
              className={styles.genButton}
              onClick={generate}
              variant="primary"
            >
              Generate mnemonic
            </Button>

            <Button
              className={styles.openButton}
              disabled={opening || !descriptionValid}
              onClick={async () => {
                const audit = auditPattern.test(description.trim());
                if (audit) {
                  const desc = description.trim();
                  await open(false, desc, false, true);
                } else {
                  const desc = description.trim().toLowerCase();
                  await open(false, desc, desc === genDescription, false);
                }
              }}
            >
              Open wallet
            </Button>
          </div>
        </div>

        <div className={styles.existingWallets}>
          {existingWallets.map(info => (
            <div
              key={info.filename}
              className={styles.walletFile}
              onClick={async () => {
                const desc = info.filename;
                await open(true, desc, false, info.viewOnly);
              }}
            >
              <div className={styles.avatar}>
                <Avatar message={info.firstAddress} />
              </div>
              <div className={styles.walletDesc}>
                <div className={styles.walletDetails}>
                  <span className={styles.lastOpen}>
                    Last opened: {util.formatDateTime(new Date(info.lastOpen))}
                  </span>{" "}
                  {info.viewOnly && (
                    <span className={styles.viewOnly}>View only</span>
                  )}
                </div>
                <div className={styles.firstAddress} title="First address">
                  {info.firstAddress}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

export default OpenForm;
