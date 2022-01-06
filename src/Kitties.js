import React, { useEffect, useState } from 'react'
import { Form, Grid } from 'semantic-ui-react'

import { useSubstrate } from './substrate-lib'
import { TxButton } from './substrate-lib/components'

import KittyCards from './KittyCards'

export default function Kitties (props) {
  const { api, keyring } = useSubstrate()
  const { accountPair } = props

  const [kitties, setKitties] = useState([])
  const [status, setStatus] = useState('')
    const [kittyDNAs, setKittyDNAs] = useState([])
    const [kittyOwners, setKittyOwners] = useState([])
  

  const fetchKitties = () => {
    // TODO: 在这里调用 `api.query.kittiesModule.*` 函数去取得猫咪的信息。
    // 你需要取得：
    //   - 共有多少只猫咪
    //   - 每只猫咪的主人是谁
    //   - 每只猫咪的 DNA 是什么，用来组合出它的形态
    let unsubscribe
    api.query.substrateKitties.kittiesCount(cnt => {
      if (!cnt.isNone) {
        // 取出加密猫的总数（从0开始）并生成数组
        const kittyIds = Array.from(Array(parseInt(cnt, 10)), (v, k) => k)
        // 查询加密猫们的主人
        api.query.substrateKitties.owner.multi(kittyIds, kittyOwners => {
          setKittyOwners(kittyOwners)
        }).catch(console.error)
        // 查询加密猫们的DNA
        api.query.substrateKitties.kitties.multi(kittyIds, kittyDna => {
          setKittyDNAs(kittyDna)
        }).catch(console.error)
      }
    }).then(unsub => {
      unsubscribe = unsub
    }).catch(console.error)

    return () => unsubscribe && unsubscribe()
  }

  const populateKitties = () => {
    const kitties = []
    for (let i = 0; i < kittyDNAs.length; ++i) {
      const kitty = {}
      kitty.id = i
      kitty.dna = kittyDNAs[i].unwrap()
      kitty.owner = keyring.encodeAddress(kittyOwners[i].unwrap())
      kitties[i] = kitty
    }
    setKitties(kitties)
  }

  useEffect(fetchKitties, [api, keyring])
  useEffect(populateKitties, [keyring,kittyDNAs,kittyOwners])

  return <Grid.Column width={16}>
    <h1>加密猫</h1>
    <KittyCards kitties={kitties} accountPair={accountPair} setStatus={setStatus}/>
    <Form style={{ margin: '1em 0' }}>
      <Form.Field style={{ textAlign: 'center' }}>
        <TxButton
          accountPair={accountPair} label='创建加密猫' type='SIGNED-TX' setStatus={setStatus}
          attrs={{
            palletRpc: 'substrateKitties',
            callable: 'create',
            inputParams: [],
            paramFields: []
          }}
        />
      </Form.Field>
    </Form>
    <div style={{ overflowWrap: 'break-word' }}>{status}</div>
  </Grid.Column>
}
