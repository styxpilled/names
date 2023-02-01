<script lang="ts">
	import { goto } from '$app/navigation';
	// import dataset from './data.json';
	import dataset from '../fakedata.json';
	import fakedata from '../fakedata.json';
	import type { Person } from '..';
	import type { PageData } from './$types';
	import ArrayInput from './ArrayInput.svelte';
	import { browser } from '$app/environment';
	/**
	 * Object.keys returns `string[]` and not `keyof Object`, so we need this little helper
	 * so TypeScript doesn't yell at us.
	 */
	const getKeys = Object.keys as <T extends object>(obj: T) => Array<keyof T>;

	export let data: PageData;
	let state = data;
	let filtered: Person[] = dataset.data;

	const isNotable = (variable: any, sp?: URLSearchParams): [URLSearchParams, boolean] => {
		let valid = false;
		for (const key of getKeys(variable)) {
			if (sp) valid = false;
			if (variable[key]) {
				if (Array.isArray(variable[key])) {
					if ((variable[key] as any[]).length > 0) valid = true;
				} else if (typeof variable[key] === 'object' && variable[key] !== null) {
					[, valid] = isNotable(variable[key]);
				} else valid = true;
			}

			if (valid && sp) sp.append(key as string, JSON.stringify(variable[key]));
		}
		return [sp || new URLSearchParams(), valid];
	};

	const maxLimits = (() => {
		const res: any = {};
		for (const k in fakedata.data[0]) {
			const key = k as keyof Person;
			let hi = 0;
			for (let index = 0; index < dataset.data.length; index++) {
				const element = dataset.data[index][key] as number;
				if (element > hi) hi = element;
			}
			res[key] = hi;
		}
		return res as Record<keyof Person, number>;
	})();

	const shuffle = () => {
		if (state.shuffle.current !== null) state.shuffle.past.push(state.shuffle.current);
		state.shuffle.current = Math.random();
		state.shuffle.past = state.shuffle.past;
	};
	const previousShuffle = () => {
		if (state.shuffle.past.length) {
			state.shuffle.current = state.shuffle.past.pop() as number;
			state.shuffle.past = state.shuffle.past;
		}
	};
	const shuffleAlgo = (a: any[]) => {
		let j, x, i;
		for (i = a.length - 1; i > 0; i--) {
			j = Math.floor((state.shuffle.current as number) * (i + 1));
			x = a[i];
			a[i] = a[j];
			a[j] = x;
		}
		return a;
	};

	const debounce = (node: Node, config: { delay?: number; callback: (s: number) => void }) => {
		const { delay = 250, callback } = config;
		let timer: ReturnType<typeof setTimeout>;
		const handleChange = (e: any) => {
			const { value } = e.currentTarget;
			clearTimeout(timer);
			timer = setTimeout(() => {
				callback(value);
			}, delay);
		};
		node.addEventListener('input', handleChange);
		return {
			destroy() {
				node.removeEventListener('input', handleChange);
			}
		};
	};

	const addLimit = (
		e: Event & {
			currentTarget: EventTarget & HTMLSelectElement;
		}
	) => {
		state.limits.push({
			key: e.currentTarget.value as keyof Person,
			max: maxLimits[e.currentTarget.value as keyof Person],
			min: 0
		});
		state.limits = state.limits;
		e.currentTarget.value = '';
	};

	$: {
		if (state.query) {
			const regex = new RegExp(state.query, 'i');
			filtered = dataset.data.filter((v) => v.value.match(regex));
		} else {
			filtered = dataset.data;
		}

		// Filter
		for (const limit of state.limits) {
			filtered = filtered.filter((v) => limit.min <= v[limit.key] && v[limit.key] <= limit.max);
		}
		// Sort
		filtered = filtered.sort((a, b) => {
			const order = state.sort.order === 'desc' ? [-1, 1] : [1, -1];
			if (a[state.sort.key] < b[state.sort.key]) return order[0];
			else if (a[state.sort.key] > b[state.sort.key]) return order[1];
			else return 0;
		});
		// Exclude
		// String.endsWith | startsWith are simple byte comparisons and are faster than a regex equivalent
		for (const suffix of state.exclude.suffixes) {
			const s = suffix.toLowerCase();
			filtered = filtered.filter((v) => !v.value.toLowerCase().endsWith(s));
		}
		for (const prefix of state.exclude.prefixes) {
			const p = prefix.toLowerCase();
			filtered = filtered.filter((v) => !v.value.toLowerCase().startsWith(p));
		}
		if (state.exclude.letters) {
			const regex = new RegExp(`^[^${state.exclude.letters}]+$`, 'i');
			filtered = filtered.filter((v) => regex.test(v.value));
		}
		// Shuffle
		if (state.shuffle.current) filtered = shuffleAlgo(filtered);
		console.log(filtered.length);
		if (browser) {
			// To update search params in Kit, you use the goto fuction just like if you were navigating
			const [sp] = isNotable(state, new URLSearchParams());
			goto(`?${sp}`, {
				keepFocus: true,
				replaceState: true,
				noScroll: true
			});
		}
	}
</script>

<p>
	<label>
		Query
		<!-- Main regex-based query -->
		<input bind:value={state.query} />
	</label>
	<label>
		Page
		<!-- Pagination page -->
		<input
			bind:value={state.page}
			type="number"
			min="1"
			max={Math.ceil(filtered.length / state.pageSize)}
		/>
	</label>
	<label>
		Page Size
		<!-- Pagination page size -->
		<input bind:value={state.pageSize} type="number" min="1" max={filtered.length} />
	</label>
</p>
<p>
	<button on:click={shuffle}>Shuffle!</button>
	<button on:click={previousShuffle}>Previous Shuffle</button>
	<button on:click={() => (state.shuffle.current = null)}>Clear shuffle</button>
	{#each state.shuffle.past as shif}
		{shif}
	{/each}
	{state.shuffle.current}
</p>
<div>
	<label>
		Limit
		<select on:change={addLimit}>
			<option />
			{#each getKeys(fakedata.data[0]).filter((val) => typeof fakedata.data[0][val] === 'number') as key}
				<option>{key}</option>
			{/each}
		</select>
	</label>
	{#each state.limits as limit}
		<p>
			<label>
				Max
				{limit.key}
				<input
					type="number"
					value={limit.max}
					min={0}
					use:debounce={{
						callback: (value) => {
							limit.max = value;
						}
					}}
				/>
			</label>
			<label>
				Min
				<input
					type="number"
					value="0"
					min={0}
					max={limit.max}
					use:debounce={{
						callback: (value) => {
							limit.min = value;
						}
					}}
				/>
			</label>
		</p>
	{/each}
</div>
<div>
	<p>Exclude Letters</p>
	<p>
		<input type="text" bind:value={state.exclude.letters} />
	</p>
	<p>Exclude Prefix</p>
	<p><ArrayInput bind:content={state.exclude.prefixes} /></p>
	<p>Exclude Suffix</p>
	<p><ArrayInput bind:content={state.exclude.suffixes} /></p>
</div>
<table>
	<thead>
		<tr>
			<!-- Show dataset object keys as table heads -->
			{#each getKeys(fakedata.data[0]) as key}
				<th
					class:asc={state.sort.key === key && state.sort.order === 'asc'}
					class:desc={state.sort.key === key && state.sort.order === 'desc'}
					on:click={() =>
						(state.sort = {
							key,
							order: state.sort.key === key ? (state.sort.order === 'asc' ? 'desc' : 'asc') : 'desc'
						})}
				>
					{key}
				</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		<!-- Paginate the results, Svelte is fast but updating tens of thousands of DOM nodes is too much (unless we'd use a virtual list but that's not in the scope of this project. if you're interested in that, look at https://github.com/sveltejs/svelte-virtual-list written by the completely insane Rich Harris) -->
		{#if filtered.length === 0}
			<p>No results!</p>
		{:else}
			{#each filtered.slice(state.pageSize * (state.page - 1), state.pageSize * state.page) as person}
				<tr>
					{#each Object.values(person) as value}
						<td>{value}</td>
					{/each}
				</tr>
			{/each}
		{/if}
	</tbody>
</table>

<style>
	th.asc {
		background-color: greenyellow;
	}
	th.desc {
		background-color: hotpink;
	}
</style>
