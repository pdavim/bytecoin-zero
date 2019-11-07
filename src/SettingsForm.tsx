// Copyright 2019 The Bytecoin developers.
// Licensed under the GNU Affero General Public License, version 3.

import React, { useContext, useEffect, useRef } from "react";
import * as util from "./lib/util";
import styles from "./css/SettingsForm.module.css";

//react bootstrap elements
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import FormControl from "react-bootstrap/FormControl";

// @ts-ignore
import NoSleep from "nosleep.js";

const dayMS = 60 * 60 * 24 * 1000;

const SettingsForm = React.memo(
  (props: {
    viewOnly: boolean;
    topBlockHeight: number;
    topKnownBlockHeight: number;
    topBlockTime: Date;
    dismiss: () => void;
  }) => {
    const syncing = props.topBlockHeight !== props.topKnownBlockHeight;
    const farBehind =
      new Date().valueOf() - props.topBlockTime.valueOf() > 2 * dayMS;
    const wantNoSleep = syncing && farBehind && util.isMobile();

    const wallet = useContext(util.WalletContext);
    const noSleep = useRef(new NoSleep());

    useEffect(() => {
      if (!wantNoSleep) {
        turnNoSleep(false);
      }
    }, [wantNoSleep]);

    const turnNoSleep = (on: boolean) => {
      console.info(`no sleep: ${on}`);

      if (on) {
        noSleep.current.enable();
      } else {
        noSleep.current.disable();
      }
    };

    const closeWallet = async () => {
      if (wallet) {
        await wallet.close();
      }
    };

    const exportMnemonic = async () => {
      if (wallet === null) {
        alert("Wallet closed");
        return;
      }

      const w = window.open();
      if (w === null) {
        alert("Failed to open window with mnemonic text");
        return;
      }

      const [resp, err] = await util.try_(
        wallet.getWalletInfo({
          need_secrets: true
        })
      );
      if (resp === undefined) {
        w.close();
        alert(`Failed to get wallet info: ${err}`);
        return;
      }

      w.document.write(`
    <html lang="en">
        <head><title>Bytecoin Mnemonic Backup</title></head>
        <body onafterprint="self.close()">
            <code style="word-break:break-all">${resp.first_address}</code><br/><br/><code>${resp.mnemonic}</code>
        </body>
    </html>
    `);
      w.print();
    };

    return (
      <div className={styles.settingsForm}>
        <div className={styles.noSleepGroup}>
          <Form>
            <Form.Check
              type="checkbox"
              id="noSleep"
              label="Prevent device sleep during sync"
              onChange={(event: React.ChangeEvent) => {
                const castEvent = (event as unknown) as React.ChangeEvent<
                  HTMLInputElement
                >;
                console.log(event);
                turnNoSleep(castEvent.target.checked);
              }}
            />
          </Form>
        </div>

        <div className={styles.exportMnemonicGroup}>
          <Button
            variant="secondary"
            className="link-like"
            onClick={exportMnemonic}
            disabled={props.viewOnly}
          >
            Export mnemonic
          </Button>{" "}
          — print or save as PDF
        </div>

        <div className={styles.controls}>
          <Button
            variant="secondary"
            className={styles.closeWallet}
            onClick={closeWallet}
          >
            Close wallet
          </Button>

          <Button
            variant="secondary"
            className={styles.dismiss}
            onClick={props.dismiss}
          >
            OK
          </Button>
        </div>
      </div>
    );
  }
);

export default SettingsForm;
