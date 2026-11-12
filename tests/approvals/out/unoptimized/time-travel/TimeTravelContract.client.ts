// This file is auto-generated, do not modify
/* eslint-disable */
import type { arc4 } from '@algorandfoundation/algorand-typescript'
import { Contract, abimethod, err } from '@algorandfoundation/algorand-typescript'

export abstract class TimeTravelContract extends Contract {
  @abimethod()
  roundAt(rnd: arc4.Uint<64>): arc4.Uint<64> {
    err('stub only')
  }

  @abimethod()
  roundBefore(rnd: arc4.Uint<64>): arc4.Uint<64> {
    err('stub only')
  }

  @abimethod()
  counterThenAndNow(rnd: arc4.Uint<64>): arc4.Tuple<readonly [arc4.Uint<64>, arc4.Uint<64>]> {
    err('stub only')
  }

  @abimethod()
  dataChanged(rnd: arc4.Uint<64>): arc4.Bool {
    err('stub only')
  }

  @abimethod()
  firstItemChanged(rnd: arc4.Uint<64>): arc4.Bool {
    err('stub only')
  }

  @abimethod()
  firstItemNow(rnd: arc4.Uint<64>): arc4.Uint<64> {
    err('stub only')
  }

  @abimethod()
  appendThenWriteBack(
    rnd: arc4.Uint<64>,
    x: arc4.Uint<64>,
  ): void {
    err('stub only')
  }

  @abimethod()
  setThenWriteBack(
    rnd: arc4.Uint<64>,
    x: arc4.Uint<64>,
  ): void {
    err('stub only')
  }

  @abimethod()
  timestamps(
    rnd: arc4.Uint<64>,
    of: arc4.Uint<64>,
  ): arc4.Uint<64> {
    err('stub only')
  }

  @abimethod()
  dataExisted(rnd: arc4.Uint<64>): arc4.DynamicBytes {
    err('stub only')
  }

  @abimethod()
  dataExistsThen(rnd: arc4.Uint<64>): arc4.Bool {
    err('stub only')
  }

  @abimethod()
  changes(
    acct: arc4.Address,
    asset: arc4.Uint<64>,
    app: arc4.Uint<64>,
    from: arc4.Uint<64>,
    to: arc4.Uint<64>,
  ): arc4.Uint<64> {
    err('stub only')
  }
}
